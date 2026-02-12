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

    $recipient_id = isset($input['recipient_id']) ? (int) $input['recipient_id'] : 0;
    $message = isset($input['message']) ? trim($input['message']) : '';

    if ($recipient_id <= 0 || $message === '') {
        echo json_encode(['status' => 'error', 'message' => 'Invalid payload']);
        exit;
    }

    // Verify relationship (optional but recommended: checks if appointment exists)
    // For now, allowing open chat if they know the ID, or we can enforce appointment check
    // Enforcing appointment check:
    $stmt = $conn->prepare("
        SELECT id FROM appointments 
        WHERE (doctor_user_id = ? AND patient_user_id = ?) 
           OR (doctor_user_id = ? AND patient_user_id = ?)
        LIMIT 1
    ");
    $stmt->bind_param('iiii', $user_id, $recipient_id, $recipient_id, $user_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        // Strict: only allow if appointment exists
        // echo json_encode(['status' => 'error', 'message' => 'No appointment found between users']);
        // exit; 
        // Relaxed: allow
    }

    $stmt = $conn->prepare("
        INSERT INTO consultation_messages (sender_id, receiver_id, message)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param('iis', $user_id, $recipient_id, $message);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message_id' => $stmt->insert_id]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to send']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $other_user_id = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;

    if ($other_user_id <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT id, sender_id, receiver_id, message, created_at, is_read
        FROM consultation_messages
        WHERE (sender_id = ? AND receiver_id = ?) 
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    ");
    $stmt->bind_param('iiii', $user_id, $other_user_id, $other_user_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = [
            'id' => $row['id'],
            'sender_id' => $row['sender_id'],
            'message' => $row['message'],
            'created_at' => $row['created_at'],
            'is_me' => ($row['sender_id'] == $user_id)
        ];
    }

    echo json_encode(['status' => 'success', 'messages' => $messages]);
}
$conn->close();
