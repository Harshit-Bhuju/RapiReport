<?php
require_once __DIR__ . '/../../config/header.php';
require_once __DIR__ . '/consultation_call_bootstrap.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];
rr_ensure_consultation_call_tables($conn);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $room_id = $input['roomId'] ?? '';
    $action = $input['action'] ?? ''; // 'ringing', 'accept', 'end', 'reject'
    $appointment_id = $input['appointmentId'] ?? null;

    if (!$room_id || !$action) {
        echo json_encode(['status' => 'error', 'message' => 'Missing roomId or action']);
        exit;
    }

    if ($action === 'ringing') {
        // If ringing, we might need to create the record if it doesn't exist
        // First check if it exists
        $stmt = $conn->prepare("SELECT id FROM consultation_calls WHERE room_id = ?");
        $stmt->bind_param("s", $room_id);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($res->num_rows === 0 && $appointment_id) {
            $stmt = $conn->prepare("INSERT INTO consultation_calls (appointment_id, room_id, caller_user_id, status) VALUES (?, ?, ?, 'ringing')");
            $stmt->bind_param("isi", $appointment_id, $room_id, $user_id);
            $stmt->execute();
        } else {
            // Update existing call, potentially updating caller if needed, but mainly status
            $stmt = $conn->prepare("UPDATE consultation_calls SET status = 'ringing', caller_user_id = ? WHERE room_id = ?");
            $stmt->bind_param("is", $user_id, $room_id);
            $stmt->execute();
        }
    } elseif ($action === 'accept') {
        $stmt = $conn->prepare("UPDATE consultation_calls SET status = 'active', start_time = CURRENT_TIMESTAMP WHERE room_id = ?");
        $stmt->bind_param("s", $room_id);
        $stmt->execute();
    } elseif ($action === 'end') {
        $stmt = $conn->prepare("UPDATE consultation_calls SET status = 'ended', end_time = CURRENT_TIMESTAMP WHERE room_id = ?");
        $stmt->bind_param("s", $room_id);
        $stmt->execute();
    } elseif ($action === 'reject') {
        $stmt = $conn->prepare("UPDATE consultation_calls SET status = 'ended', end_time = CURRENT_TIMESTAMP WHERE room_id = ?");
        $stmt->bind_param("s", $room_id);
        $stmt->execute();
    }

    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
}
$conn->close();
