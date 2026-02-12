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
    $query = "SELECT u.id, u.email, u.username, u.profile_pic, u.role, 
                     dp.display_name, dp.specialty, dp.experience_years, dp.consultation_rate, dp.bio, dp.is_available, dp.availability_json
              FROM users u
              LEFT JOIN doctor_profiles dp ON u.id = dp.user_id
              WHERE u.role = 'doctor'";

    $result = $conn->query($query);
    $consultants = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $row['availability_json'] = json_decode($row['availability_json'] ?? '[]', true);
            $consultants[] = $row;
        }
    }

    echo json_encode(["status" => "success", "consultants" => $consultants]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
