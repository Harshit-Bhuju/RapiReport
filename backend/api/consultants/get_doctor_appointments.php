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

// Ensure user is doctor
$stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();
$u = $res->fetch_assoc();
if (!$u || $u['role'] !== 'doctor') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Only doctors can view this."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch upcoming and recent appointments
    $query = "
        SELECT 
            a.id, 
            a.appointment_date, 
            a.appointment_time_slot, 
            a.status,
            a.patient_user_id,
            u.username as patient_name,
            u.profile_pic as patient_profile_pic,
            u.email as patient_email,
            cc.room_id,
            cc.status as call_status
        FROM appointments a
        JOIN users u ON a.patient_user_id = u.id
        LEFT JOIN consultation_calls cc ON a.id = cc.appointment_id
        WHERE a.doctor_user_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time_slot ASC
    ";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $appointments = [];
    while ($row = $result->fetch_assoc()) {
        $appointments[] = $row;
    }

    echo json_encode(["status" => "success", "appointments" => $appointments]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
