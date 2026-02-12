<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . "/../../config/dbconnect.php";
require_once __DIR__ . "/../../config/header.php";

// Public Listing API (requires login)
$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all doctors
    $query = "SELECT u.id, u.username, u.profile_pic, 
                     dp.display_name, dp.specialty, dp.experience_years, dp.consultation_rate, dp.bio, dp.is_available, dp.availability_json
              FROM users u
              JOIN doctor_profiles dp ON u.id = dp.user_id
              WHERE u.role = 'doctor' AND dp.is_available = 1";

    $result = $conn->query($query);
    $doctors = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $row['availability_json'] = json_decode($row['availability_json'] ?? '[]', true);
            $doctors[] = $row;
        }
    }

    echo json_encode(["status" => "success", "doctors" => $doctors]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
