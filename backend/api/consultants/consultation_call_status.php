<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . '/../../config/dbconnect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $room_id = $input['roomId'] ?? '';
    $action = $input['action'] ?? ''; // 'start', 'end', 'reject'

    if (!$room_id || !$action) {
        echo json_encode(['status' => 'error', 'message' => 'Missing roomId or action']);
        exit;
    }

    if ($action === 'start') {
        $stmt = $conn->prepare("UPDATE consultation_calls SET status = 'active', start_time = CURRENT_TIMESTAMP WHERE room_id = ?");
        $stmt->bind_param("s", $room_id);
        $stmt->execute();
    } elseif ($action === 'end') {
        $stmt = $conn->prepare("UPDATE consultation_calls SET status = 'completed', end_time = CURRENT_TIMESTAMP WHERE room_id = ?");
        $stmt->bind_param("s", $room_id);
        $stmt->execute();
    }

    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
}
$conn->close();
