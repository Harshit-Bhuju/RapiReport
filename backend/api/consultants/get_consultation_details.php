<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . "/../../config/dbconnect.php";
require_once __DIR__ . "/../../config/header.php";

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized."]);
    exit;
}

$room_id = $_GET['room_id'] ?? '';

if (!$room_id) {
    echo json_encode(["status" => "error", "message" => "Room ID required."]);
    exit;
}

// Fetch appointment details joined with consultation_calls
// We need to verify the user is either the doctor or the patient
$query = "
    SELECT 
        cc.room_id, cc.status as call_status, cc.start_time,
        a.id as appointment_id, a.appointment_date, a.appointment_time_slot,
        doc.id as doctor_id, doc.username as doctor_name, doc.profile_pic as doctor_avatar,
        pat.id as patient_id, pat.username as patient_name, pat.profile_pic as patient_avatar
    FROM consultation_calls cc
    JOIN appointments a ON cc.appointment_id = a.id
    JOIN users doc ON a.doctor_user_id = doc.id
    JOIN users pat ON a.patient_user_id = pat.id
    WHERE cc.room_id = ?
";

$stmt = $conn->prepare($query);
$stmt->bind_param("s", $room_id);
$stmt->execute();
$result = $stmt->get_result();
$details = $result->fetch_assoc();

if (!$details) {
    echo json_encode(["status" => "error", "message" => "Consultation not found."]);
    exit;
}

// Verify authorization
if ($details['doctor_id'] != $user_id && $details['patient_id'] != $user_id) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied."]);
    exit;
}

// Determine role in this call
$is_doctor = ($details['doctor_id'] == $user_id);
$other_party = $is_doctor ? [
    'id' => $details['patient_id'],
    'name' => $details['patient_name'],
    'avatar' => $details['patient_avatar'],
    'role' => 'patient'
] : [
    'id' => $details['doctor_id'],
    'name' => $details['doctor_name'],
    'avatar' => $details['doctor_avatar'],
    'role' => 'doctor'
];

echo json_encode([
    "status" => "success",
    "details" => [
        "room_id" => $details['room_id'],
        "call_status" => $details['call_status'],
        "appointment_date" => $details['appointment_date'],
        "appointment_time" => $details['appointment_time_slot'],
        "other_party" => $other_party,
        "is_doctor" => $is_doctor
    ]
]);

$conn->close();
exit;
