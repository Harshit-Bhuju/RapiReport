<?php
require_once __DIR__ . '/../../config/header.php';
require_once __DIR__ . '/consultation_call_bootstrap.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];
rr_ensure_consultation_call_tables($conn);

$raw = file_get_contents('php://input');
$data = json_decode($raw, true) ?: [];

$appointment_id = isset($data['appointment_id']) ? (int) $data['appointment_id'] : 0;

if ($appointment_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid appointment']);
    exit;
}

// Verify the user is the doctor for this appointment
$stmt = $conn->prepare("SELECT id, doctor_user_id, patient_user_id FROM appointments WHERE id = ? AND doctor_user_id = ?");
$stmt->bind_param("ii", $appointment_id, $user_id);
$stmt->execute();
$res = $stmt->get_result();
$apt = $res->fetch_assoc();

if (!$apt) {
    echo json_encode(['status' => 'error', 'message' => 'Only the doctor can start a call for this appointment.']);
    exit;
}

// End any existing ringing/active calls for this appointment
$stmt = $conn->prepare("UPDATE consultation_calls SET status = 'ended', end_time = CURRENT_TIMESTAMP WHERE appointment_id = ? AND status IN ('ringing', 'active')");
$stmt->bind_param("i", $appointment_id);
$stmt->execute();

// Create a new call room
$room_id = bin2hex(random_bytes(16));

$stmt2 = $conn->prepare("INSERT INTO consultation_calls (appointment_id, room_id, caller_user_id, status) VALUES (?, ?, ?, 'ringing')");
$stmt2->bind_param("isi", $appointment_id, $room_id, $user_id);

if (!$stmt2->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'Could not start call. Please try again.']);
    exit;
}

$call_id = (int) $stmt2->insert_id;

echo json_encode([
    'status' => 'success',
    'call' => [
        'id' => $call_id,
        'room_id' => $room_id,
        'caller_user_id' => $user_id,
        'callee_user_id' => $apt['patient_user_id'],
    ],
]);

$conn->close();
