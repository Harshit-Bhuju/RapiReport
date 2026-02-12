<?php
/**
 * gemini_ocr.php — Uses Gemini Vision to read handwritten prescriptions.
 * Accepts a base64-encoded image, sends it to Gemini, returns extracted text + medicines.
 */
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include __DIR__ . '/../config/dbconnect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true) ?: [];

$imageBase64 = $data['image'] ?? '';
$mimeType = $data['mimeType'] ?? 'image/jpeg';

if (empty($imageBase64)) {
    echo json_encode(['status' => 'error', 'message' => 'No image provided']);
    exit;
}

$apiKey = getenv("GEMINI_API_KEY") ?: getenv("VITE_GEMINI_API_KEY") ?: "";
if (empty($apiKey)) {
    // Debug: list all environment variables starting with GEMINI or VITE
    $allEnv = getenv();
    $found = [];
    foreach($_ENV as $k => $v) if(strpos($k, 'GEMINI') !== false || strpos($k, 'VITE') !== false) $found[] = $k;
    echo json_encode(['status' => 'error', 'message' => 'Gemini API key not configured. Found: ' . implode(', ', $found)]);
    exit;
}

$prompt = 'You are a medical prescription OCR expert. Look at this prescription image carefully. It may be handwritten.

Extract ALL text you can read, especially:
- Medicine names (even if handwritten/abbreviated)
- Dosages (mg, ml, etc.)
- Frequencies (e.g. 1-0-1, twice daily, BD, TID)
- Duration (e.g. 5 days, 1 week)

Return a valid JSON object (no markdown, no code fences) with this structure:
{
  "rawText": "The full extracted text from the image, line by line",
  "meds": [
    { "name": "Medicine Name", "dose": "500mg", "frequency": "1-0-1", "duration": "5 days", "raw": "original line as read" }
  ]
}

If you cannot read a word clearly, include your best guess with a ? suffix (e.g. "Amoxicillin?").
Always return the JSON object even if no medicines are found (empty meds array).';

$modelId = getenv("GEMINI_MODEL") ?: "gemini-1.5-flash";
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelId}:generateContent?key={$apiKey}";

$postData = [
    'contents' => [[
        'parts' => [
            ['text' => $prompt],
            [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data' => $imageBase64
                ]
            ]
        ]
    ]]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    $errBody = json_decode($response, true);
    $errMsg = $errBody['error']['message'] ?? 'Gemini API error';
    echo json_encode(['status' => 'error', 'message' => $errMsg]);
    exit;
}

$responseData = json_decode($response, true);
$text = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';
$text = preg_replace('/^```\w*\s*|\s*```$/m', '', trim($text));
$parsed = json_decode($text, true);

if (!is_array($parsed)) {
    // If Gemini didn't return valid JSON, return the raw text
    echo json_encode([
        'status' => 'success',
        'rawText' => $text,
        'meds' => []
    ]);
    exit;
}

$rawText = $parsed['rawText'] ?? $text;
$meds = $parsed['meds'] ?? [];

// Save to OCR history
$sql = "INSERT INTO ocr_history (user_id, image_path, raw_text) VALUES (?, '', ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("is", $user_id, $rawText);
$stmt->execute();

echo json_encode([
    'status' => 'success',
    'rawText' => $rawText,
    'meds' => $meds,
    'historyId' => $stmt->insert_id
]);
?>
