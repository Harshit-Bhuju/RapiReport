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

// Initial target is the current user (self-analysis)
$target_user_id = $user_id;
$is_family_analysis = false;
$is_doctor_analysis = false;

$input = json_decode(file_get_contents('php://input'), true);
if (isset($input['member_id']) && (int)$input['member_id'] > 0) {
    $target_member_id = (int)$input['member_id'];

    // If target is self, just proceed
    if ($target_member_id === $user_id) {
        $target_user_id = $user_id;
    } else {
        // If I'm a doctor, check if I have an appointment with this patient
        $role = $_SESSION['role'] ?? '';

        // Robustness: If role is not in session, fetch it
        if (empty($role)) {
            $rStmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
            $rStmt->bind_param("i", $user_id);
            $rStmt->execute();
            $rRes = $rStmt->get_result()->fetch_assoc();
            $role = $rRes['role'] ?? '';
            $_SESSION['role'] = $role; // Set it for future requests
            $rStmt->close();
        }

        if ($role === 'doctor') {
            $check = $conn->prepare("SELECT 1 FROM appointments WHERE doctor_user_id = ? AND patient_user_id = ? LIMIT 1");
            $check->bind_param('ii', $user_id, $target_member_id);
            $check->execute();
            if ($check->get_result()->num_rows > 0) {
                $target_user_id = $target_member_id;
                $is_doctor_analysis = true;
            }
            $check->close();
        }

        if (!$is_doctor_analysis) {
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
                echo json_encode(['status' => 'error', 'message' => 'Not an accepted family member or patient']);
                exit;
            }
            $target_user_id = $target_member_id;
            $is_family_analysis = true;
            $check->close();
        }
    }
}

// 1. Fetch User Profile (Conditions, Allergies, etc.)
$stmt = $conn->prepare("SELECT username, dob, gender, blood_group, conditions, custom_conditions, parental_history FROM users WHERE id = ?");
$stmt->bind_param("i", $target_user_id);
$stmt->execute();
$userProfile = $stmt->get_result()->fetch_assoc();
$stmt->close();

// 2. Fetch Past Scans & Prescriptions (Unified in ocr_history)
$stmt = $conn->prepare("SELECT id, note, raw_text, refined_json, created_at FROM ocr_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
$stmt->bind_param("i", $target_user_id);
$stmt->execute();
$historyRows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$pastRecords = [];
foreach ($historyRows as $row) {
    $medsArr = [];
    if (!empty($row['refined_json'])) {
        $parsed = json_decode($row['refined_json'], true);
        if (is_array($parsed)) $medsArr = $parsed;
    }
    // Format meds for the AI prompt
    $medsStr = implode(", ", array_map(fn($m) => ($m['name'] ?? '') . (isset($m['dose']) && $m['dose'] ? " ({$m['dose']})" : ''), $medsArr));

    $pastRecords[] = [
        'id' => $row['id'],
        'note' => $row['note'],
        'raw_text' => $row['raw_text'],
        'meds' => $medsStr,
        'created_at' => $row['created_at'],
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

// 4. Select Purpose-Specific API Key & Model
$apiKey = getenv("GEMINI_KEY_MEDICAL") ?: getenv("GEMINI_API_KEY");

if (!$apiKey) {
    echo json_encode(['status' => 'error', 'message' => 'Gemini API key not configured']);
    exit;
}

if ($is_doctor_analysis) {
    $apiKey = getenv("GEMINI_KEY_DOCTOR") ?: $apiKey;
} elseif ($is_family_analysis) {
    $apiKey = getenv("GEMINI_KEY_FAMILY") ?: $apiKey;
}

$modelId = getenv("GEMINI_MODEL") ?: "gemini-1.5-flash";
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

$historyContext .= "Prescription & Scan History (Full Context):\n";
foreach ($pastRecords as $p) {
    $note = (isset($p['note']) && $p['note']) ? $p['note'] : (isset($p['raw_text']) ? substr($p['raw_text'], 0, 100) . "..." : 'No details');
    $meds = $p['meds'] ?? 'No meds categorized';
    $historyContext .= "- [" . $p['created_at'] . "] Info: " . $note . " | Meds: " . $meds . "\n";
    if (isset($p['raw_text'])) {
        $historyContext .= "  Full Content: " . substr($p['raw_text'], 0, 500) . "...\n";
    }
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

if (function_exists('mb_convert_encoding')) {
    $historyContext = mb_convert_encoding($historyContext, 'UTF-8', 'UTF-8');
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
        [
            "parts" => [["text" => $prompt]]
        ]
    ],
    "system_instruction" => [
        "parts" => [["text" => "You are a professional medical history analyzer for the RapiReport app."]]
    ]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData, JSON_PARTIAL_OUTPUT_ON_ERROR));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($httpCode !== 200) {
    $userMessage = 'AI analysis failed. Please try again.';
    if ($httpCode === 429) {
        $userMessage = 'Too many requests. The AI service is rate-limited. Please wait a minute or two and try again.';
    } elseif ($httpCode >= 500) {
        $userMessage = 'The AI service is temporarily unavailable. Please try again later.';
    }
    echo json_encode([
        'status' => 'error',
        'message' => $userMessage,
        'http_code' => $httpCode,
        'error' => $error,
        'details' => json_decode($response, true)
    ]);
    exit;
}

$resData = json_decode($response, true);

// Gemini can return 200 with an error in the body (e.g. quota, blocked)
if (!empty($resData['error'])) {
    $err = $resData['error'];
    $code = $err['code'] ?? 0;
    $userMessage = is_numeric($code) && (int)$code === 429
        ? 'Too many requests. Please wait a minute or two and try again.'
        : ('AI analysis failed. ' . ($err['message'] ?? 'Please try again.'));
    echo json_encode([
        'status' => 'error',
        'message' => $userMessage,
        'http_code' => (int)$code ?: 500,
        'details' => $err
    ]);
    exit;
}

$analysis = $resData['candidates'][0]['content']['parts'][0]['text'] ?? null;
if (empty($analysis)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'AI could not generate analysis. Please try again.',
        'http_code' => 502
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'analysis' => $analysis
]);
