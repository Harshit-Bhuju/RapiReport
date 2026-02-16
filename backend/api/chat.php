include(__DIR__ . '/../config/header.php');

/**
* Gemini AI Chat Proxy (Simplified - No DB Persistence)
*/

// Get raw POST data
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true);

$message = $data['message'] ?? '';
$language = $data['language'] ?? 'en';

if (empty($message)) {
echo json_encode(["error" => "Message is required"]);
exit;
}

// Get API Key from environment (specifically for Chatbox)
$apiKey = getenv("GEMINI_KEY_CHAT") ?: getenv("GEMINI_API_KEY");

if (!$apiKey) {
echo json_encode(["error" => "Gemini API key not configured"]);
exit;
}

$systemPrompt = "
You are RapiReport AI, a specialized Health Intelligence Assistant for Nepal.
Your goal is to help users understand their medical reports and provide general health guidance.

### KEY GUIDELINES:
1. **Scope**: Only answer health, wellness, and medical report related questions.
2. **Medical Disclaimer**: Always include a disclaimer at the end of every response.
3. **Tone**: Helpful, empathetic, and professional.
4. **Side Effects**: When suggesting or explaining medicines, always include potential side effects.
5. **Bilingual**: Support both English and Nepali. Respond in the language used by the user (" . ($language === 'ne' ? 'Nepali' : 'English') . ").
";

$postData = [
"contents" => [
[
"parts" => [
["text" => $message]
]
]
],
"systemInstruction" => [
"parts" => [
["text" => $systemPrompt]
]
]
];

// Rate Limit: 3 messages per day for FREE AI Chat
$user_id = $_SESSION['user_id'] ?? 0;
if ($user_id > 0) {
if (!checkAIRateLimit($conn, $user_id, 3)) {
echo json_encode(["error" => "Daily AI Chat limit (3 messages) reached. Please try again tomorrow."]);
exit;
}
}

// Model Selection - Strictly use gemini-3-flash for Chat
$modelId = "gemini-3-flash";
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelId}:generateContent?key={$apiKey}";

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
echo json_encode(["error" => "AI Quota exceeded. Please try again in a few minutes."]);
} else {
echo json_encode([
"error" => "Gemini API Error",
"details" => json_decode($response, true) ?: $curlError,
"code" => $httpCode,
"model_tried" => $modelId
]);
}
exit;
}

$responseData = json_decode($response, true);
$responseText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';

// DB Persistence removed as requested by user to simplify and avoid SQL errors.

echo json_encode([
"text" => [
"en" => $responseText,
"ne" => $responseText
]
]);

if (isset($conn)) {
$conn->close();
}