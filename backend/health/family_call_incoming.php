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

// Fetch most recent ringing calls for this user as callee
$stmt = $conn->prepare("
    SELECT 
        c.id,
        c.room_id,
        c.caller_user_id,
        u.username AS caller_name,
        u.email AS caller_email,
        u.profile_pic AS caller_profile_picture,
        c.created_at
    FROM family_calls c
    JOIN users u ON u.id = c.caller_user_id
    WHERE c.callee_user_id = ?
      AND c.status = 'ringing'
    ORDER BY c.created_at DESC
    LIMIT 5
");
$stmt->bind_param('i', $user_id);
$stmt->execute();
$res = $stmt->get_result();

$calls = [];
while ($row = $res->fetch_assoc()) {
    $calls[] = [
        'id' => (int) $row['id'],
        'room_id' => $row['room_id'],
        'caller_user_id' => (int) $row['caller_user_id'],
        'caller_name' => $row['caller_name'],
        'caller_email' => $row['caller_email'],
        'caller_profile_picture' => $row['caller_profile_picture'],
        'created_at' => $row['created_at'],
    ];
}

echo json_encode([
    'status' => 'success',
    'calls' => $calls,
]);

