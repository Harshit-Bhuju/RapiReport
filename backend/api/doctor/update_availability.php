<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . "/../../config/dbconnect.php";
require_once __DIR__ . "/../../config/header.php";

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized."]);
    exit;
}

// Ensure user is a doctor
$stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
if (!$user || $user['role'] !== 'doctor') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Only doctors can update availability."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Expecting availability_json to be an array or object
    $availability = $input['availability'] ?? null;

    if (!$availability) {
        echo json_encode(["status" => "error", "message" => "Availability data matches required."]);
        exit;
    }

    $availability_json = json_encode($availability);

    // Update doctor_profiles
    $stmt = $conn->prepare("UPDATE doctor_profiles SET availability_json = ? WHERE user_id = ?");
    $stmt->bind_param("si", $availability_json, $user_id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Availability updated successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to update availability."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
