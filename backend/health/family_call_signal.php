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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];

    $room_id = isset($data['roomId']) ? trim($data['roomId']) : '';
    $to_user_id = isset($data['toUserId']) ? (int) $data['toUserId'] : 0;
    $type = isset($data['type']) ? trim($data['type']) : '';
    $payload = $data['payload'] ?? null;

    if ($room_id === '' || $to_user_id <= 0 || $type === '' || $payload === null) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid payload']);
        exit;
    }

    $payload_json = json_encode($payload);

    $stmt = $conn->prepare("
        INSERT INTO family_call_signals (room_id, from_user_id, to_user_id, type, payload_json)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('siiss', $room_id, $user_id, $to_user_id, $type, $payload_json);

    if (!$stmt->execute()) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to send signal']);
        exit;
    }

    echo json_encode([
        'status' => 'success',
        'signal' => [
            'id' => (int) $stmt->insert_id,
        ],
    ]);
    exit;
}

// GET => poll for new signals for the current user
$room_id = isset($_GET['roomId']) ? trim($_GET['roomId']) : '';
$since_id = isset($_GET['sinceId']) ? (int) $_GET['sinceId'] : 0;

if ($room_id === '') {
    echo json_encode(['status' => 'error', 'message' => 'roomId is required']);
    exit;
}

$stmt = $conn->prepare("
    SELECT id, from_user_id, type, payload_json, created_at
    FROM family_call_signals
    WHERE room_id = ? 
      AND to_user_id = ?
      AND id > ?
    ORDER BY id ASC
    LIMIT 50
");
$stmt->bind_param('sii', $room_id, $user_id, $since_id);
$stmt->execute();
$res = $stmt->get_result();

$signals = [];
while ($row = $res->fetch_assoc()) {
    $signals[] = [
        'id' => (int) $row['id'],
        'from_user_id' => (int) $row['from_user_id'],
        'type' => $row['type'],
        'payload' => json_decode($row['payload_json'], true),
        'created_at' => $row['created_at'],
    ];
}

echo json_encode([
    'status' => 'success',
    'signals' => $signals,
]);

