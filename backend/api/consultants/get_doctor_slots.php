<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . "/../../config/dbconnect.php";
require_once __DIR__ . "/../../config/header.php";

$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $doctor_id = intval($_GET['doctor_id'] ?? 0);
    $date = trim($_GET['date'] ?? '');

    if (!$doctor_id || !$date) {
        echo json_encode(["status" => "error", "message" => "Missing doctor_id or date"]);
        exit;
    }

    // Fetch booked slots for this doctor and date
    // Only block 'confirmed' slots. 'pending' means payment not yet completed.
    $stmt = $conn->prepare("SELECT appointment_time_slot FROM appointments WHERE doctor_user_id = ? AND appointment_date = ? AND status = 'confirmed'");
    $stmt->bind_param("is", $doctor_id, $date);
    $stmt->execute();
    $result = $stmt->get_result();

    $booked_slots = [];
    while ($row = $result->fetch_assoc()) {
        $booked_slots[] = $row['appointment_time_slot'];
    }

    echo json_encode(["status" => "success", "booked_slots" => $booked_slots]);
    $conn->close();
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method"]);
}
