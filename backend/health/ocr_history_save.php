<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include __DIR__ . '/../config/dbconnect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true) ?: [];

$raw_text = isset($data['raw_text']) ? trim($data['raw_text']) : '';
$image_path = isset($data['image_path']) ? trim($data['image_path']) : '';

if (empty($raw_text)) {
    echo json_encode(['status' => 'error', 'message' => 'No text to save']);
    exit;
}

$sql = "INSERT INTO ocr_history (user_id, image_path, raw_text) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iss", $user_id, $image_path, $raw_text);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(['status' => 'success', 'id' => $stmt->insert_id]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save']);
}
?>
