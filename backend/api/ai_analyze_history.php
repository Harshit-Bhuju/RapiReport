<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int)$_SESSION['user_id'];

// Check if we are analyzing a family member or ourselves
$target_user_id = $user_id;
$is_family_analysis = false;

$input = json_decode(file_get_contents('php://input'), true);
if (isset($input['member_id']) && (int)$input['member_id'] > 0) {
    $target_member_id = (int)$input['member_id'];

    // Verify family relationship (accepted, either direction)
    $check = $conn->prepare("
        SELECT 1 FROM family_members
        WHERE status = 'accepted'
          AND (
              (user_id = ? AND member_user_id = ?)
              OR
              (user_id = ? AND member_user_id = ?)
          )
        LIMIT 1
    ");
    $check->bind_param('iiii', $user_id, $target_member_id, $target_member_id, $user_id);
    $check->execute();
    $checkRes = $check->get_result();

    if ($checkRes->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Not an accepted family member']);
        exit;
    }
    $target_user_id = $target_member_id;
    $is_family_analysis = true;
    $check->close();
}

// 1. Fetch User Profile (Conditions, Allergies, etc.)
$stmt = $conn->prepare("SELECT username, dob, gender, blood_group, conditions, custom_conditions, parental_history FROM users WHERE id = ?");
$stmt->bind_param("i", $target_user_id);
$stmt->execute();
$userProfile = $stmt->get_result()->fetch_assoc();
$stmt->close();

// 2. Fetch Past Prescriptions (OCR and Saved)
// OCR History - full text, no truncation
$stmt = $conn->prepare("SELECT raw_text, refined_text, created_at FROM ocr_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
$stmt->bind_param("i", $target_user_id);
$stmt->execute();
$ocrHistory = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Saved Prescriptions with medicines from prescription_medicines
$stmt = $conn->prepare("SELECT id, note, raw_text, created_at FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
$stmt->bind_param("i", $target_user_id);
$stmt->execute();
$prescriptionRows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();
$savedPrescriptions = [];
foreach ($prescriptionRows as $p) {
    $medsStmt = $conn->prepare("SELECT name, dose, frequency, duration FROM prescription_medicines WHERE prescription_id = ?");
    $medsStmt->bind_param("i", $p['id']);
    $medsStmt->execute();
    $meds = $medsStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $medsStmt->close();
    $medsStr = implode(", ", array_map(fn($m) => ($m['name'] ?? '') . ($m['dose'] ? " ({$m['dose']})" : ''), $meds));
    $savedPrescriptions[] = [
        'note' => $p['note'],
        'raw_text' => $p['raw_text'],
        'meds' => $medsStr,
        'created_at' => $p['created_at'],
    ];
}

// 3. Fetch Lab Reports
$reports = [];
$tableCheck = $conn->query("SHOW TABLES LIKE 'reports'");
if ($tableCheck && $tableCheck->num_rows > 0) {
    $stmt = $conn->prepare("SELECT lab_name, report_type, report_date, ai_summary_en, raw_text, overall_status, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC LIMIT 30");
    if ($stmt) {
        $stmt->bind_param("i", $target_user_id);
        $stmt->execute();
        $reports = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
    }
}

// 5. Fetch Recent Symptoms
$stmt = $conn->prepare("SELECT text, severity, log_date AS date, vitals_json FROM symptoms WHERE user_id = ? ORDER BY log_date DESC LIMIT 50");
$stmt->bind_param("i", $target_user_id);
$stmt->execute();
$symptoms = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// 4. Construct Clinical Prompt
$apiKey = getenv("GEMINI_API_KEY") ?: "REPLACE_WITH_YOUR_BACKEND_API_KEY";
$modelId = getenv("GEMINI_MODEL") ?: "gemini-2.5-flash";
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelId}:generateContent?key={$apiKey}";

$patientName = $userProfile['username'] ?? $userProfile['email'] ?? 'Patient';
$historyContext = "IMPORTANT: The patient's name is: " . $patientName . ". Always use this exact name in your analysis. Do NOT invent or use any other names.\n\n";
$historyContext .= "User Profile:\n";
$historyContext .= "- Name: " . $patientName . "\n";
$historyContext .= "- Gender: " . ($userProfile['gender'] ?? 'Not specified') . "\n";
$historyContext .= "- Blood Group: " . ($userProfile['blood_group'] ?? 'Not specified') . "\n";
$historyContext .= "- Existing Conditions: " . ($userProfile['conditions'] ?? 'None') . "\n";
$historyContext .= "- Other/Custom: " . ($userProfile['custom_conditions'] ?? 'None') . "\n";
$historyContext .= "- Family History: " . ($userProfile['parental_history'] ?? 'None') . "\n\n";

$historyContext .= "Saved Prescriptions (with parsed medicines):\n";
foreach ($savedPrescriptions as $p) {
    $note = $p['note'] ?? $p['raw_text'] ?? 'No notes';
    $meds = $p['meds'] ?? 'No meds listed';
    $historyContext .= "- [" . $p['created_at'] . "] Note: " . $note . " | Medicines: " . $meds . "\n";
}

$historyContext .= "\nScanned Documents (OCR - full text):\n";
foreach ($ocrHistory as $o) {
    $text = $o['refined_text'] ?? $o['raw_text'] ?? 'No text';
    $historyContext .= "--- [Date: " . $o['created_at'] . "] ---\n" . $text . "\n\n";
}

$historyContext .= "\nLab/Diagnostic Reports:\n";
foreach ($reports as $r) {
    $summary = $r['ai_summary_en'] ?? $r['raw_text'] ?? 'No summary';
    if (strlen($summary) > 1500) $summary = substr($summary, 0, 1500) . '...';
    $historyContext .= "- [" . ($r['report_date'] ?? $r['created_at']) . "] " . ($r['report_type'] ?? 'Report') . " (" . ($r['lab_name'] ?? 'Lab') . ") - Status: " . ($r['overall_status'] ?? 'N/A') . "\n";
    $historyContext .= "  Summary: " . $summary . "\n\n";
}

$historyContext .= "\nSymptoms logged by user:\n";
foreach ($symptoms as $s) {
    $vitals = $s['vitals_json'] ? json_decode($s['vitals_json'], true) : null;
    $vitalsStr = $vitals && isset($vitals['temp']) ? " (Temp: {$vitals['temp']}°C)" : "";
    $historyContext .= "- [" . $s['date'] . "] " . $s['text'] . " (Severity: " . $s['severity'] . ")" . $vitalsStr . "\n";
}

$prompt = "
You are RapiReport AI, a senior medical analyst. 
Analyze the following patient history and provide a comprehensive clinical summary.

### PATIENT HISTORY DATA:
{$historyContext}

### YOUR TASK:
1. **Health Summary**: Provide a high-level overview of the patient's current health status based on history and symptoms.
2. **Medication Insights**: Identify potential long-term medicine patterns or risks.
3. **Risk Analysis**: Based on family history and existing conditions, highlight what they should monitor.
4. **Actionable Suggestions**: Suggest specific lifestyle changes, follow-up tests, or questions for their next doctor visit.
5. **Warnings**: If you see severe recurring symptoms and no corresponding prescription, or dangerous combinations, flag it.

### FORMATTING:
- Use **Markdown** for clarity.
- Use # and ## for headers.
- Keep the tone professional but empathetic.
- CRITICAL: Use the patient's actual name ({$patientName}) throughout. Never invent or substitute names.
- Include the standard medical disclaimer:
  \"Note: This is an AI-generated health insight based on your history. Please consult a qualified doctor for clinical diagnosis.\"
";

$postData = [
    "contents" => [
        ["parts" => [["text" => $prompt]]]
    ],
    "systemInstruction" => [
        "parts" => [["text" => "You are a professional medical history analyzer for the RapiReport app."]]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 45);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode(['status' => 'error', 'message' => 'AI analysis failed', 'details' => json_decode($response, true)]);
    exit;
}

$resData = json_decode($response, true);
$analysis = $resData['candidates'][0]['content']['parts'][0]['text'] ?? 'No analysis generated.';

echo json_encode([
    'status' => 'success',
    'analysis' => $analysis
]);
