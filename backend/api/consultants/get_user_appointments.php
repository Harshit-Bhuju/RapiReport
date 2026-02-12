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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch user appointments with doctor details
    $query = "SELECT a.id, a.appointment_date, a.appointment_time_slot, a.status, a.consultation_fee, a.notes, a.created_at,
                     COALESCE(dp.display_name, u.username) as doctor_name, dp.specialty, u.profile_pic as doctor_profile_pic,
                     a.doctor_user_id,
                     cc.room_id
              FROM appointments a
              LEFT JOIN doctor_profiles dp ON a.doctor_user_id = dp.user_id
              JOIN users u ON a.doctor_user_id = u.id
              LEFT JOIN consultation_calls cc ON a.id = cc.appointment_id
              WHERE a.patient_user_id = ?
              ORDER BY a.appointment_date DESC, a.appointment_time_slot DESC";

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
exit;
