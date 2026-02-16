<?php

/**
 * header.php - Centralized CORS and Session management.
 * MUST be included first in all API files.
 */

// Load environment variables
require_once __DIR__ . '/env_loader.php';
loadEnv(__DIR__ . '/../../.env');

// 1. CORS Headers - Must be set BEFORE any output/requires
$allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.8:5173",
    "https://www.harshitbhuju.com.np",
    "https://harshitbhuju.com.np",
    "https://harmanbhuju.com.np",
    "https://www.harmanbhuju.com.np",
    "https://api.harmanbhuju.com.np",
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// If the origin is in our allowed list, or is a common tunnel/local dev, or matches our production domains
$isAllowed = false;
if (in_array($origin, $allowedOrigins)) {
    $isAllowed = true;
} elseif (preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|.*\.trycloudflare\.com|.*\.local|.*\.harmanbhuju\.com\.np|.*\.harshitbhuju\.com\.np)(:\d+)?$/', $origin)) {
    $isAllowed = true;
} elseif ($origin === "https://harmanbhuju.com.np" || $origin === "https://harshitbhuju.com.np") {
    $isAllowed = true;
}

if ($isAllowed) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    // Fallback: Default to the requester's origin if it's one of our known domains
    // This handles cases where in_array might fail due to hidden characters
    if (strpos($origin, 'harmanbhuju.com.np') !== false || strpos($origin, 'harshitbhuju.com.np') !== false) {
        header("Access-Control-Allow-Origin: " . $origin);
    }
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request immediately
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Core includes - Only after headers are set
require_once(__DIR__ . "/dbconnect.php");
require_once(__DIR__ . "/session_config.php");

/**
 * AI Rate Limiting Helper
 */
function checkAIRateLimit($conn, $user_id, $dailyLimit = 5)
{
    $today = date('Y-m-d');

    // Check current usage
    $stmt = $conn->prepare("SELECT request_count FROM ai_usage WHERE user_id = ? AND request_date = ?");
    $stmt->bind_param("is", $user_id, $today);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $usage = $row ? (int)$row['request_count'] : 0;

    if ($usage >= $dailyLimit) {
        return false;
    }

    // Increment usage
    if ($row) {
        $upd = $conn->prepare("UPDATE ai_usage SET request_count = request_count + 1 WHERE user_id = ? AND request_date = ?");
        $upd->bind_param("is", $user_id, $today);
        $upd->execute();
    } else {
        $ins = $conn->prepare("INSERT INTO ai_usage (user_id, request_date, request_count) VALUES (?, ?, 1)");
        $ins->bind_param("is", $user_id, $today);
        $ins->execute();
    }

    return true;
}
