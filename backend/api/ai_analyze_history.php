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
$stmt = $conn->prepare("SELECT username, dob, gender, blood_group, conditions, allergies, parental_history FROM users WHERE id = ?");
$stmt->bind_param("i", $target_user_id);
$stmt->execute();
$userProfile = $stmt->get_result()->fetch_assoc();
$stmt->close();

// 2. Fetch Past Prescriptions (OCR and Saved)
// OCR History
$stmt = $conn->prepare("SELECT raw_text, created_at FROM ocr_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
$stmt->bind_param("i", $target_user_id);
$stmt->execute();
$ocrHistory = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// Saved Prescriptions
$stmt = $conn->prepare("SELECT note, meds, created_at FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
$stmt->bind_param("i", $target_user_id);
$stmt->execute();
$savedPrescriptions = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// 3. Fetch Recent Symptoms
$stmt = $conn->prepare("SELECT text, severity, date FROM symptoms WHERE user_id = ? ORDER BY date DESC LIMIT 30");
$stmt->bind_param("i", $target_user_id);
$stmt->execute();
$symptoms = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

// 4. Construct Clinical Prompt
$apiKey = getenv("GEMINI_API_KEY") ?: "REPLACE_WITH_YOUR_BACKEND_API_KEY";
$modelId = getenv("GEMINI_MODEL") ?: "gemini-2.5-flash";
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelId}:generateContent?key={$apiKey}";

$historyContext = "User Profile:\n";
$historyContext .= "- Gender: " . ($userProfile['gender'] ?? 'Not specified') . "\n";
$historyContext .= "- Blood Group: " . ($userProfile['blood_group'] ?? 'Not specified') . "\n";
$historyContext .= "- Existing Conditions: " . ($userProfile['conditions'] ?? 'None') . "\n";
$historyContext .= "- Allergies: " . ($userProfile['allergies'] ?? 'None') . "\n";
$historyContext .= "- Family History: " . ($userProfile['parental_history'] ?? 'None') . "\n\n";

$historyContext .= "Recent Prescriptions (Saved):\n";
foreach ($savedPrescriptions as $p) {
    $historyContext .= "- [" . $p['created_at'] . "] Note: " . $p['note'] . " | Meds: " . $p['meds'] . "\n";
}

$historyContext .= "\nRecent Scanned Prescriptions (OCR):\n";
foreach ($ocrHistory as $o) {
    $historyContext .= "- [" . $o['created_at'] . "] Raw Text: " . substr($o['raw_text'], 0, 200) . "...\n";
}

$historyContext .= "\nRecent Symptoms logged by user:\n";
foreach ($symptoms as $s) {
    $historyContext .= "- [" . $s['date'] . "] " . $s['text'] . " (Severity: " . $s['severity'] . ")\n";
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
