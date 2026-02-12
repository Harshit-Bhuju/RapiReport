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
    // Determine user role to fetch appropriate data
    $role_query = "SELECT role FROM users WHERE id = ?";
    $role_stmt = $conn->prepare($role_query);
    $role_stmt->bind_param("i", $user_id);
    $role_stmt->execute();
    $role = $role_stmt->get_result()->fetch_assoc()['role'] ?? 'patient';
    $role_stmt->close();

    if ($role === 'doctor') {
        // As a doctor, I want to see patients who booked me
        $query = "SELECT a.id, a.appointment_date, a.appointment_time_slot, a.status, a.consultation_fee, a.notes, a.created_at,
                         u.username as display_name, u.profile_pic as profile_pic, 'Patient' as specialty,
                         a.patient_user_id as other_user_id,
                         a.doctor_user_id, a.patient_user_id,
                         cc.room_id, cc.call_status,
                         pt.payment_status
                  FROM appointments a
                  JOIN users u ON a.patient_user_id = u.id
                  LEFT JOIN (
                      SELECT appointment_id, room_id, status as call_status
                      FROM consultation_calls
                      WHERE id IN (SELECT MAX(id) FROM consultation_calls GROUP BY appointment_id)
                  ) cc ON a.id = cc.appointment_id
                  LEFT JOIN (
                      SELECT appointment_id, payment_status
                      FROM payment_transactions
                      WHERE id IN (SELECT MAX(id) FROM payment_transactions GROUP BY appointment_id)
                  ) pt ON a.id = pt.appointment_id
                  WHERE a.doctor_user_id = ?
                  ORDER BY a.appointment_date DESC, a.appointment_time_slot DESC";
    } else {
        // As a patient, I want to see doctors I booked
        $query = "SELECT a.id, a.appointment_date, a.appointment_time_slot, a.status, a.consultation_fee, a.notes, a.created_at,
                         COALESCE(dp.display_name, u.username) as display_name, dp.specialty, u.profile_pic as profile_pic,
                         a.doctor_user_id as other_user_id,
                         a.doctor_user_id, a.patient_user_id,
                         cc.room_id, cc.call_status,
                         pt.payment_status
                  FROM appointments a
                  LEFT JOIN doctor_profiles dp ON a.doctor_user_id = dp.user_id
                  JOIN users u ON a.doctor_user_id = u.id
                  LEFT JOIN (
                      SELECT appointment_id, room_id, status as call_status
                      FROM consultation_calls
                      WHERE id IN (SELECT MAX(id) FROM consultation_calls GROUP BY appointment_id)
                  ) cc ON a.id = cc.appointment_id
                  LEFT JOIN (
                      SELECT appointment_id, payment_status
                      FROM payment_transactions
                      WHERE id IN (SELECT MAX(id) FROM payment_transactions GROUP BY appointment_id)
                  ) pt ON a.id = pt.appointment_id
                  WHERE a.patient_user_id = ?
                  ORDER BY a.appointment_date DESC, a.appointment_time_slot DESC";
    }

    $stmt = $conn->prepare($query);
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "SQL Error"]);
        exit;
    }
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
