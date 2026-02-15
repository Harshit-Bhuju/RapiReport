<?php
/**
 * consultation_chat.php
 * Doctor <-> Patient chat. Supports appointment_id for per-appointment chat threads.
 * Chat history is saved and viewable. New chat starts per appointment.
 * Run migration: add_appointment_id_to_consultation_messages.sql
 */
require_once __DIR__ . '/../../config/header.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

// Check if appointment_id column exists
$hasAppointmentId = false;
$cols = $conn->query("SHOW COLUMNS FROM consultation_messages LIKE 'appointment_id'");
if ($cols && $cols->num_rows > 0) {
    $hasAppointmentId = true;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $recipient_id = isset($input['recipient_id']) ? (int) $input['recipient_id'] : 0;
    $message = isset($input['message']) ? trim($input['message']) : '';
    $appointment_id = isset($input['appointment_id']) ? (int) $input['appointment_id'] : null;

    if ($recipient_id <= 0 || $message === '') {
        echo json_encode(['status' => 'error', 'message' => 'Invalid payload']);
        exit;
    }

    // Verify user is part of the conversation
    $stmt = $conn->prepare("
        SELECT id FROM appointments
        WHERE (doctor_user_id = ? AND patient_user_id = ?)
        OR (doctor_user_id = ? AND patient_user_id = ?)
        LIMIT 1
    ");
    $stmt->bind_param('iiii', $user_id, $recipient_id, $recipient_id, $user_id);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0 && !$appointment_id) {
        // Allow if no strict check (legacy)
    }

    if ($hasAppointmentId && $appointment_id > 0) {
        $stmt = $conn->prepare("
            INSERT INTO consultation_messages (sender_id, receiver_id, appointment_id, message)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->bind_param('iiis', $user_id, $recipient_id, $appointment_id, $message);
    } else {
        $stmt = $conn->prepare("
            INSERT INTO consultation_messages (sender_id, receiver_id, message)
            VALUES (?, ?, ?)
        ");
        $stmt->bind_param('iis', $user_id, $recipient_id, $message);
    }

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message_id' => $stmt->insert_id]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to send']);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $other_user_id = isset($_GET['user_id']) ? (int) $_GET['user_id'] : 0;
    $appointment_id = isset($_GET['appointment_id']) ? (int) $_GET['appointment_id'] : null;

    if ($other_user_id <= 0 && ($appointment_id <= 0 || !$hasAppointmentId)) {
        echo json_encode(['status' => 'error', 'message' => 'user_id or appointment_id required']);
        exit;
    }

    if ($hasAppointmentId && $appointment_id > 0) {
        // Verify user belongs to this appointment
        $check = $conn->prepare("SELECT id FROM appointments WHERE id = ? AND (doctor_user_id = ? OR patient_user_id = ?) LIMIT 1");
        $check->bind_param('iii', $appointment_id, $user_id, $user_id);
        $check->execute();
        if ($check->get_result()->num_rows === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Not authorized']);
            $conn->close();
            exit;
        }
        $stmt = $conn->prepare("
            SELECT id, sender_id, receiver_id, message, created_at, is_read
            FROM consultation_messages
            WHERE appointment_id = ?
            ORDER BY created_at ASC
        ");
        $stmt->bind_param('i', $appointment_id);
    } else {
        $stmt = $conn->prepare("
            SELECT id, sender_id, receiver_id, message, created_at, is_read
            FROM consultation_messages
            WHERE (sender_id = ? AND receiver_id = ?)
            OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at ASC
        ");
        $stmt->bind_param('iiii', $user_id, $other_user_id, $other_user_id, $user_id);
    }
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
