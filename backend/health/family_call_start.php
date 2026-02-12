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

$member_user_id = isset($data['member_user_id']) ? (int) $data['member_user_id'] : 0;

if ($member_user_id <= 0 || $member_user_id === $user_id) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid call target']);
    exit;
}

// Only allow calling accepted family members (either direction)
$sql = "
    SELECT 1 
    FROM family_members 
    WHERE status = 'accepted'
      AND (
          (user_id = ? AND member_user_id = ?)
          OR
          (user_id = ? AND member_user_id = ?)
      )
    LIMIT 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param('iiii', $user_id, $member_user_id, $member_user_id, $user_id);
$stmt->execute();
$res = $stmt->get_result();

if ($res->num_rows === 0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'You can only call accepted family members.',
    ]);
    exit;
}

// Create a new call room
$room_id = bin2hex(random_bytes(16));

$stmt2 = $conn->prepare("
    INSERT INTO family_calls (room_id, caller_user_id, callee_user_id, status)
    VALUES (?, ?, ?, 'ringing')
");
$stmt2->bind_param('sii', $room_id, $user_id, $member_user_id);

if (!$stmt2->execute()) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Could not start call. Please try again.',
    ]);
    exit;
}

$call_id = (int) $stmt2->insert_id;

echo json_encode([
    'status' => 'success',
    'call' => [
        'id' => $call_id,
        'room_id' => $room_id,
        'caller_user_id' => $user_id,
        'callee_user_id' => $member_user_id,
    ],
]);

