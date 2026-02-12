<?php
/**
 * gemini_analyze_report.php — Uses Gemini Vision to analyze lab/diagnostic report images.
 * Extracts raw text, parses tests (name, result, unit, range, status), and generates AI summary.
 */
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

$user_id = $_SESSION['user_id'];
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true) ?: [];

$imageBase64 = $data['image'] ?? '';
$mimeType = $data['mimeType'] ?? 'image/jpeg';

if (empty($imageBase64)) {
    echo json_encode(['status' => 'error', 'message' => 'No image provided']);
    exit;
}

$apiKey = getenv("GEMINI_API_KEY") ?: $_ENV["GEMINI_API_KEY"] ?? $_SERVER["GEMINI_API_KEY"] ?? "";

if (empty($apiKey)) {
    echo json_encode(['status' => 'error', 'message' => 'Gemini API key not configured']);
    exit;
}

$prompt = 'You are a medical lab report analyst. Look at this diagnostic/lab report image carefully.

Extract:
1. Lab/center name
2. Report type (e.g. Blood Analysis, Thyroid Panel, CBC, Lipid Profile)
3. Report date (if visible)
4. ALL test results: test name, result value, unit, reference range, status (normal/low/high/critical)

Return a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "labName": "Lab or Hospital name",
  "reportType": "Type of report",
  "reportDate": "YYYY-MM-DD or null if not found",
  "rawText": "Full extracted text line by line",
  "tests": [
    { "name": "Test name", "result": "value", "unit": "e.g. g/dL", "refRange": "e.g. 13.5-17.5", "status": "normal|low|high|critical" }
  ],
  "aiSummaryEn": "2-3 sentence plain English summary for the patient. Mention key findings and any concerns.",
  "aiSummaryNe": "Same summary in Nepali (Devanagari script)."
}

If status is unclear from the image, infer from result vs reference range. Always return the JSON object.';

$models = array_filter([
    getenv("GEMINI_MODEL"),
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
]);
$models = array_unique($models);

$response = null;
$httpCode = 0;
$errBody = null;

foreach ($models as $modelId) {
    if (empty($modelId)) continue;
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
    curl_setopt($ch, CURLOPT_TIMEOUT, 45);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) break;

    $errBody = json_decode($response, true);
    if ($httpCode !== 429) break;
}

if ($httpCode !== 200) {
    $errBody = $errBody ?? json_decode($response ?? '{}', true);
    $rawMsg = $errBody['error']['message'] ?? 'Analysis failed';
    if (strpos($rawMsg, 'quota') !== false || strpos($rawMsg, 'RESOURCE_EXHAUSTED') !== false || $httpCode === 429) {
        preg_match('/retry in ([\d.]+)s/i', $rawMsg, $m);
        $retrySec = isset($m[1]) ? (int) ceil((float) $m[1]) : 60;
        $rawMsg = "API quota exceeded. Please wait {$retrySec} seconds and try again.";
    }
    echo json_encode(['status' => 'error', 'message' => $rawMsg]);
    exit;
}

$responseData = json_decode($response, true);
$candidates = $responseData['candidates'] ?? [];
$candidate = $candidates[0] ?? null;

if (!$candidate || empty($candidate['content']['parts'])) {
    echo json_encode(['status' => 'error', 'message' => 'No content generated']);
    exit;
}

$text = $candidate['content']['parts'][0]['text'] ?? '';
$text = preg_replace('/^```\w*\s*|\s*```$/m', '', trim($text));
$parsed = json_decode($text, true);

if (!is_array($parsed)) {
    echo json_encode([
        'status' => 'success',
        'labName' => null,
        'reportType' => 'Unknown',
        'reportDate' => null,
        'rawText' => $text,
        'tests' => [],
        'aiSummaryEn' => 'Could not fully parse report. Raw text extracted.',
        'aiSummaryNe' => 'रिपोर्ट पूर्ण विश्लेषण गर्न सकिएन। कच्चा पाठ निकालिएको छ।',
        'overallStatus' => 'normal'
    ]);
    exit;
}

$tests = $parsed['tests'] ?? [];
$overallStatus = 'normal';
foreach ($tests as $t) {
    $s = strtolower($t['status'] ?? 'normal');
    if ($s === 'critical' || $s === 'high' || $s === 'low') {
        $overallStatus = 'abnormal';
        break;
    }
}

echo json_encode([
    'status' => 'success',
    'labName' => $parsed['labName'] ?? null,
    'reportType' => $parsed['reportType'] ?? 'Lab Report',
    'reportDate' => $parsed['reportDate'] ?? null,
    'rawText' => $parsed['rawText'] ?? $text,
    'tests' => $tests,
    'aiSummaryEn' => $parsed['aiSummaryEn'] ?? 'Report analyzed.',
    'aiSummaryNe' => $parsed['aiSummaryNe'] ?? 'रिपोर्ट विश्लेषण गरिएको छ।',
    'overallStatus' => $overallStatus
]);
