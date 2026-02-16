<?php
include __DIR__ . '/../config/header.php';

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

// Rate Limit: 10 scans per day
if (!checkAIRateLimit($conn, $user_id, 10)) {
    echo json_encode(['status' => 'error', 'message' => 'Daily Scan limit (10) reached. Please try again tomorrow.']);
    exit;
}

// 1. Image Hash Caching
$imageHash = md5($imageBase64);
$stmt = $conn->prepare("SELECT id, raw_text, refined_json, image_path FROM ocr_history WHERE image_hash = ? AND user_id = ? LIMIT 1");
$stmt->bind_param("si", $imageHash, $user_id);
$stmt->execute();
$cacheRes = $stmt->get_result()->fetch_assoc();
if ($cacheRes) {
    echo json_encode([
        'status' => 'success',
        'rawText' => $cacheRes['raw_text'],
        'meds' => json_decode($cacheRes['refined_json'], true) ?: [],
        'historyId' => $cacheRes['id'],
        'imagePath' => $cacheRes['image_path'],
        'cached' => true
    ]);
    exit;
}

$apiKey = getenv("GEMINI_KEY_OCR") ?: getenv("GEMINI_KEY_MEDICAL") ?: getenv("GEMINI_API_KEY");

if (empty($apiKey)) {
    echo json_encode(['status' => 'error', 'message' => 'Gemini API key not configured']);
    exit;
}

$prompt = 'You are a medical prescription OCR expert. Look at this prescription image carefully. It may be handwritten.

Extract ALL text and return a valid JSON object with this exact structure:
{
  "rawText": "full extracted text",
  "meds": [
    { "name": "Medicine Name", "dose": "e.g. 500mg", "frequency": "1-0-1", "duration": "5 days", "raw": "original line" }
  ],
  "alternatives": [ { "for": "unclear name", "suggested": "possible full name" } ],
  "clarityScore": 0-100,
  "warnings": [ "any obvious interaction warnings or red flags" ]
}

If no medicines are found, return empty arrays. Output JSON ONLY.';

// Single Model to minimize quota burn - Strictly use gemini-2.5-flash for OCR
$modelId = "gemini-2.5-flash";
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
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode !== 200) {
    if ($httpCode === 429) {
        $msg = "AI Quota exceeded. Please try again in a few minutes.";
    } else {
        $msg = "AI Analysis failed. Please try again.";
    }
    echo json_encode(['status' => 'error', 'message' => $msg, 'code' => $httpCode]);
    exit;
}

$responseData = json_decode($response, true);
$text = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';
$text = preg_replace('/^```\w*\s*|\s*```$/m', '', trim($text));
$parsed = json_decode($text, true);

if (!is_array($parsed)) {
    $parsed = ['rawText' => $text, 'meds' => [], 'alternatives' => [], 'clarityScore' => 0, 'warnings' => []];
}

$rawText = $parsed['rawText'] ?? $text;
$meds = $parsed['meds'] ?? [];

// Save OCR image
$image_path = '';
$upload_dir = __DIR__ . '/../uploads/ocr/';
if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);

$decoded = base64_decode($imageBase64, true);
if ($decoded !== false && strlen($decoded) > 0) {
    $ext = (strpos($mimeType, 'png') !== false) ? 'png' : 'jpg';
    $filename = 'ocr_' . uniqid('', true) . '.' . $ext;
    if (file_put_contents($upload_dir . $filename, $decoded) !== false) {
        $image_path = $filename;
    }
}

// Save to history
$meds_json = json_encode($meds);
$stmt = $conn->prepare("INSERT INTO ocr_history (user_id, image_path, image_hash, raw_text, refined_json) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("issss", $user_id, $image_path, $imageHash, $rawText, $meds_json);
$stmt->execute();

echo json_encode([
    'status' => 'success',
    'rawText' => $rawText,
    'meds' => $meds,
    'alternatives' => $parsed['alternatives'] ?? [],
    'clarityScore' => $parsed['clarityScore'] ?? 0,
    'warnings' => $parsed['warnings'] ?? [],
    'historyId' => $stmt->insert_id,
    'imagePath' => $image_path
]);
