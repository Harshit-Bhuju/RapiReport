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
    $doctor_id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($doctor_id <= 0) {
        echo json_encode(["status" => "error", "message" => "Invalid doctor ID."]);
        exit;
    }

    $query = "SELECT u.id, u.username, u.profile_pic, 
                     dp.display_name, dp.specialty, dp.experience_years, dp.consultation_rate, dp.bio, dp.is_available, dp.availability_json,
                     dp.education
              FROM users u
              LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
              WHERE u.id = ? AND u.role = 'doctor'";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $doctor_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $row['availability_json'] = json_decode($row['availability_json'] ?? '[]', true);
        echo json_encode(["status" => "success", "doctor" => $row]);
    } else {
        echo json_encode(["status" => "error", "message" => "Doctor not found."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
