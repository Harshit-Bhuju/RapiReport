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
$currentMeds = $data['currentMeds'] ?? [];
$conditions = $data['conditions'] ?? [];
$mealType = trim($data['mealType'] ?? 'breakfast');

$apiKey = getenv("GEMINI_API_KEY") ?: "";
if (empty($apiKey)) {
    echo json_encode(['status' => 'success', 'suggestion' => 'AI not configured', 'interactions' => []]);
    exit;
}

$medsStr = is_array($currentMeds) ? implode(', ', array_slice($currentMeds, 0, 10)) : '';
$conditionsStr = is_array($conditions) ? implode(', ', $conditions) : '';

$prompt = "You are a nutritionist AI. Suggest a healthy " . $mealType . " meal plan.";
if ($medsStr) {
    $prompt .= "\n\nPatient is taking: " . $medsStr . "\nCheck for any food-medicine interactions (e.g. avoid grapefruit with certain meds, avoid high-tyramine foods with MAOIs, etc.).";
}
if ($conditionsStr) {
    $prompt .= "\n\nPatient conditions: " . $conditionsStr;
}
$prompt .= "\n\nRespond with:\n1) Meal suggestion (2-3 items)\n2) Any interaction warnings\n3) Brief nutrition note.\nKeep it concise (under 150 words).";

$modelId = getenv("GEMINI_MODEL") ?: "gemini-2.5-flash";
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelId}:generateContent?key={$apiKey}";
$postData = ['contents' => [['parts' => [['text' => $prompt]]]]];
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode(['status' => 'error', 'message' => 'AI service error']);
    exit;
}

$responseData = json_decode($response, true);
$text = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';

echo json_encode(['status' => 'success', 'suggestion' => $text, 'interactions' => []]);
