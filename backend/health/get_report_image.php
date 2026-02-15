<?php
/**
 * Serves report images. Requires auth. Mirrors get_prescription_image.php.
 */
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';

// CORS for cross-origin img with credentials
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://www.harshitbhuju.com.np', 'https://harshitbhuju.com.np', 'https://harmanbhuju.com.np', 'https://www.harmanbhuju.com.np'];
if (in_array($origin, $allowed) || preg_match('/^https?:\/\/(localhost|127\.0\.0\.1|.*\.trycloudflare\.com)(:\d+)?$/', $origin)) {
    header("Access-Control-Allow-Origin: " . $origin);
}
header("Access-Control-Allow-Credentials: true");

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit;
}

$file = isset($_GET['file']) ? basename($_GET['file']) : '';
if (!preg_match('/^rpt_[a-zA-Z0-9_.-]+\.(jpg|jpeg|png)$/i', $file)) {
    http_response_code(400);
    exit;
}

$path = __DIR__ . '/../uploads/reports/' . $file;
if (!file_exists($path) || !is_file($path)) {
    http_response_code(404);
    exit;
}

$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
$mime = $ext === 'png' ? 'image/png' : 'image/jpeg';
header('Content-Type: ' . $mime);
header('Cache-Control: private, max-age=3600');
readfile($path);
exit;
