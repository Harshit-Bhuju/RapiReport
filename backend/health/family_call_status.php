<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';
require_once __DIR__ . '/family_call_bootstrap.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

rr_ensure_family_call_tables($conn);

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];

$call_id = isset($data['callId']) ? (int) $data['callId'] : 0;
$action = isset($data['action']) ? trim($data['action']) : '';

if ($call_id <= 0 || $action === '') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
    exit;
}

if ($action === 'accept') {
    $stmt = $conn->prepare("
        UPDATE family_calls
        SET status = 'active', accepted_at = CURRENT_TIMESTAMP
        WHERE id = ? AND callee_user_id = ? AND status = 'ringing'
    ");
    $stmt->bind_param('ii', $call_id, $user_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Call not found or already handled']);
    }
    exit;
}

if ($action === 'end') {
    $stmt = $conn->prepare("
        UPDATE family_calls
        SET status = 'ended', ended_at = CURRENT_TIMESTAMP
        WHERE id = ? AND (caller_user_id = ? OR callee_user_id = ?)
    ");
    $stmt->bind_param('iii', $call_id, $user_id, $user_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Call not found']);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Unknown action']);

