<?php
/**
 * Serves prescription images. Requires auth. Path must be in uploads/prescriptions/.
 */
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    exit;
}

$file = isset($_GET['file']) ? basename($_GET['file']) : '';
if (!preg_match('/^rx_[a-zA-Z0-9_.-]+\.(jpg|jpeg|png)$/i', $file)) {
    http_response_code(400);
    exit;
}

$path = __DIR__ . '/../uploads/prescriptions/' . $file;
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
