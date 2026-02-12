<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include __DIR__ . '/../config/header.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true) ?: [];
$ocrText = trim($data['ocrText'] ?? $data['text'] ?? '');
$patientHistory = $data['patientHistory'] ?? null; // optional: { conditions, allergies, currentMeds }

if (empty($ocrText)) {
    echo json_encode(['status' => 'error', 'message' => 'ocrText required']);
    exit;
}

$apiKey = getenv("GEMINI_API_KEY") ?: "";
if (empty($apiKey)) {
    echo json_encode([
        'status' => 'success',
        'meds' => [],
        'alternatives' => [],
        'clarityScore' => 0,
        'warnings' => [],
        'message' => 'AI not configured; use manual parsing',
    ]);
    exit;
}

$historyNote = '';
if (is_array($patientHistory)) {
    $parts = [];
    if (!empty($patientHistory['conditions'])) $parts[] = 'Conditions: ' . (is_string($patientHistory['conditions']) ? $patientHistory['conditions'] : json_encode($patientHistory['conditions']));
    if (!empty($patientHistory['allergies'])) $parts[] = 'Allergies: ' . (is_string($patientHistory['allergies']) ? $patientHistory['allergies'] : json_encode($patientHistory['allergies']));
    if (!empty($patientHistory['currentMeds'])) $parts[] = 'Current meds: ' . (is_string($patientHistory['currentMeds']) ? $patientHistory['currentMeds'] : json_encode($patientHistory['currentMeds']));
    $historyNote = implode("\n", $parts);
}

$prompt = "You are a medical prescription parser. Given the following OCR text from a prescription image, respond with a valid JSON object only (no markdown, no code block), with this exact structure:

{
  \"meds\": [ { \"name\": \"Medicine name\", \"dose\": \"e.g. 500mg\", \"frequency\": \"e.g. twice daily\", \"duration\": \"e.g. 5 days\", \"raw\": \"original line\" } ],
  \"alternatives\": [ { \"for\": \"unclear or abbreviated name\", \"suggested\": \"Possible full name or alternative\" } ],
  \"clarityScore\": number from 0 to 100 (100 = perfectly legible and complete),
  \"warnings\": [ \"any interaction or contraindication warning based on patient history if provided\" ]
}

OCR text:\n" . $ocrText;
if ($historyNote) {
    $prompt .= "\n\nPatient history (check for interactions/contraindications):\n" . $historyNote;
}
$prompt .= "\n\nOutput only the JSON object.";

$modelId = getenv("GEMINI_MODEL") ?: "gemini-1.5-flash";
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelId}:generateContent?key={$apiKey}";
$postData = [
    'contents' => [['parts' => [['text' => $prompt]]]],
];
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode(['status' => 'error', 'message' => 'AI service error', 'meds' => [], 'alternatives' => [], 'clarityScore' => 0, 'warnings' => []]);
    exit;
}

$responseData = json_decode($response, true);
$text = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';
$text = preg_replace('/^```\w*\s*|\s*```$/m', '', trim($text));
$parsed = json_decode($text, true);
if (!is_array($parsed)) {
    echo json_encode(['status' => 'success', 'meds' => [], 'alternatives' => [], 'clarityScore' => 0, 'warnings' => []]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'meds' => $parsed['meds'] ?? [],
    'alternatives' => $parsed['alternatives'] ?? [],
    'clarityScore' => isset($parsed['clarityScore']) ? (int) $parsed['clarityScore'] : 0,
    'warnings' => $parsed['warnings'] ?? [],
]);
