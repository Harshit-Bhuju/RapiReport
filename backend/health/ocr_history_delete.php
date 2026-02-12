<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include __DIR__ . '/../config/dbconnect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true) ?: [];
$id = isset($data['id']) ? (int)$data['id'] : 0;

if ($id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
    exit;
}

$user_id = $_SESSION['user_id'];

$sql = "DELETE FROM ocr_history WHERE id = ? AND user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $id, $user_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(['status' => 'success', 'message' => 'Record deleted']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Record not found or not owned by user']);
}
?>
