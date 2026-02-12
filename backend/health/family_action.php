<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true) ?: [];

$link_id = isset($data['link_id']) ? (int)$data['link_id'] : 0;
$action = isset($data['action']) ? $data['action'] : ''; // 'accept' or 'reject'

if ($link_id <= 0 || !in_array($action, ['accept', 'reject'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
    exit;
}

// 1. Verify that the user is the recipient of this invitation and status is pending
$stmt = $conn->prepare("SELECT id FROM family_members WHERE id = ? AND member_user_id = ? AND status = 'pending' LIMIT 1");
$stmt->bind_param("ii", $link_id, $user_id);
$stmt->execute();
if ($stmt->get_result()->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invitation not found or not directed to you']);
    exit;
}
$stmt->close();

if ($action === 'accept') {
    $stmt = $conn->prepare("UPDATE family_members SET status = 'accepted', invitation_token = NULL, token_expires = NULL WHERE id = ?");
    $stmt->bind_param("i", $link_id);
} else {
    $stmt = $conn->prepare("DELETE FROM family_members WHERE id = ?");
    $stmt->bind_param("i", $link_id);
}

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Invitation ' . ($action === 'accept' ? 'accepted' : 'rejected')]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
}
$stmt->close();
$conn->close();
