<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . "/../../config/dbconnect.php";
require_once __DIR__ . "/../../config/header.php";

// Admin Check
$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized."]);
    exit;
}

$stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$admin_res = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$admin_res || $admin_res['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Forbidden: Admin access required."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stats = [];

    // Total Users
    $stats['total_users'] = $conn->query("SELECT COUNT(*) as count FROM users")->fetch_assoc()['count'];

    // Total Doctors
    $stats['total_doctors'] = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'doctor'")->fetch_assoc()['count'];

    // Total Appointments
    $stats['total_appointments'] = $conn->query("SELECT COUNT(*) as count FROM appointments")->fetch_assoc()['count'];

    // Scheduled Appointments
    $stats['scheduled_appointments'] = $conn->query("SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'")->fetch_assoc()['count'];

    // Completed Appointments
    $stats['completed_appointments'] = $conn->query("SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'")->fetch_assoc()['count'];

    // Total Revenue (assuming consultation_fee is stored in appointments)
    $stats['total_revenue'] = $conn->query("SELECT SUM(consultation_fee) as total FROM appointments WHERE status IN ('confirmed', 'completed')")->fetch_assoc()['total'] ?: 0;

    // Recent Activity (last 5 appointments)
    $recent_res = $conn->query("SELECT a.id, a.status, a.appointment_date, a.appointment_time_slot, 
                                       pu.username as patient_name, du.username as doctor_name
                                FROM appointments a
                                JOIN users pu ON a.patient_user_id = pu.id
                                JOIN users du ON a.doctor_user_id = du.id
                                ORDER BY a.created_at DESC LIMIT 5");
    $recent_activity = [];
    if ($recent_res) {
        while ($row = $recent_res->fetch_assoc()) {
            $recent_activity[] = $row;
        }
    }
    $stats['recent_activity'] = $recent_activity;

    echo json_encode(["status" => "success", "stats" => $stats]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
