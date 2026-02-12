<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include(__DIR__ . '/../config/dbconnect.php');
include(__DIR__ . '/../config/header.php');

/**
 * Gemini AI Chat Proxy with Database Persistence
 */

// Get raw POST data
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true);

$message = $data['message'] ?? '';
$language = $data['language'] ?? 'en';
$user_id = $_SESSION['user_id'] ?? null;

if (empty($message)) {
    echo json_encode(["error" => "Message is required"]);
    exit;
}

// Get API Key from environment or define it
$apiKey = getenv("GEMINI_API_KEY") ?: "REPLACE_WITH_YOUR_BACKEND_API_KEY";

if ($apiKey === "REPLACE_WITH_YOUR_BACKEND_API_KEY") {
    // Fallback if not set in env
    // $apiKey = "your_actual_key_here"; 
}

$modelId = getenv("GEMINI_MODEL") ?: "gemini-2.5-flash";
$url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelId}:generateContent?key={$apiKey}";

$systemPrompt = "
You are RapiReport AI, a specialized Health Intelligence Assistant for Nepal. 
Your goal is to help users understand their medical reports and provide general health guidance.

### KEY GUIDELINES:
1. **Scope**: Only answer health, wellness, and medical report related questions. 
2. **Medical Disclaimer**: Always include a disclaimer at the end of every response. 
3. **Tone**: Helpful, empathetic, and professional.
4. **Bilingual**: Support both English and Nepali. Respond in the language used by the user (" . ($language === 'ne' ? 'Nepali' : 'English') . ").
5. **Formatting**: Use Markdown to make your answers clear and beautiful. 
   - Use # or ## for sections.
   - Use **bold** for key terms or values.
   - Use bullet points for lists.
   - Use tables for comparing data if applicable.
6. **Report Analysis**: Explain medical values in simple terms based on standard ranges, but advise consulting a doctor.
7. **Restrictions**: Politely decline non-health related queries.

### DISCLAIMERS:
- EN: \"Note: This is an AI-generated health insight. Please consult a qualified doctor for medical diagnosis and treatment.\"
- NE: \"द्रष्टव्य: यो AI द्वारा उत्पन्न स्वास्थ्य जानकारी हो। कृपया चिकित्सा निदान र उपचारको लागि योग्य डाक्टरसँग परामर्श गर्नुहोस्।\"
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

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($httpCode !== 200) {
    echo json_encode([
        "error" => "Gemini API Error",
        "details" => json_decode($response, true) ?: $curlError,
        "code" => $httpCode
    ]);
    exit;
}

$responseData = json_decode($response, true);
$responseText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';

// PERSIST TO DATABASE if user is logged in
if ($user_id && !empty($responseText)) {
    try {
        // Save user message
        $stmt = $conn->prepare("INSERT INTO chat_messages (user_id, role, content_en, content_ne) VALUES (?, 'user', ?, ?)");
        $stmt->bind_param("iss", $user_id, $message, $message);
        $stmt->execute();
        $stmt->close();

        // Save bot response
        $stmt = $conn->prepare("INSERT INTO chat_messages (user_id, role, content_en, content_ne) VALUES (?, 'bot', ?, ?)");
        $stmt->bind_param("iss", $user_id, $responseText, $responseText);
        $stmt->execute();
        $stmt->close();
    } catch (Exception $e) {
        // Log error but don't fail the response
        error_log("Chat Persistence Error: " . $e->getMessage());
    }
}

echo json_encode([
    "text" => [
        "en" => $responseText,
        "ne" => $responseText
    ]
]);

if (isset($conn)) {
    $conn->close();
}
