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

$data = json_decode(file_get_contents("php://input"));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $data->action ?? '';

    if ($action === 'adjust_points') {
        $target_user_id = intval($data->user_id);
        $points_delta = intval($data->points);

        // Update territory_users
        $stmt = $conn->prepare("INSERT INTO territory_users (user_id, cumulative_points, last_refresh_date) 
                               VALUES (?, ?, CURDATE()) 
                               ON DUPLICATE KEY UPDATE 
                               cumulative_points = cumulative_points + ?");
        $stmt->bind_param("iii", $target_user_id, $points_delta, $points_delta);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Points adjusted successfully."]);
        } else {
            echo json_encode(["status" => "error", "message" => "Database error."]);
        }
        $stmt->close();
    } else if ($action === 'manage_reward') {
        // Future: implement reward list management (add/delete rewrads)
        echo json_encode(["status" => "error", "message" => "Not implemented yet."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
