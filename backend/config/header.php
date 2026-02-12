<?php

/**
 * header.php - Centralized CORS and Session management.
 * MUST be included first in all API files.
 */

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

// If the origin is in our allowed list, or is a common tunnel/local dev
if (
    in_array($origin, $allowedOrigins) ||
    preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|.*\.trycloudflare\.com|.*\.local)(:\d+)?$/', $origin)
) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    // Optional: Allow production domain even if origin header is missing for some reason
    // But browsers REQUIRE the Origin header for CORS
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
