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

$link_id = isset($data['id']) ? (int)$data['id'] : 0;

if ($link_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
    exit;
}

// Only allow removing links the user owns (either side)
$sql = "DELETE FROM family_members WHERE id = ? AND (user_id = ? OR member_user_id = ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iii", $link_id, $user_id, $user_id);
$stmt->execute();

if ($stmt->affected_rows > 0) {
    echo json_encode(['status' => 'success', 'message' => 'Member removed']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Not found or not authorized']);
}
?>
