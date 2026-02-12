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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $target_user_id = intval($input['user_id'] ?? 0);
    $target_role = trim($input['role'] ?? '');

    if (!$target_user_id || !in_array($target_role, ['user', 'doctor', 'admin'])) {
        echo json_encode(["status" => "error", "message" => "Invalid user ID or role."]);
        exit;
    }

    $conn->begin_transaction();

    try {
        // Update user role
        $stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
        $stmt->bind_param("si", $target_role, $target_user_id);
        $stmt->execute();
        $stmt->close();

        // If assigning doctor role, ensure a profile exists
        if ($target_role === 'doctor') {
            // Get username to fill display_name
            $stmt = $conn->prepare("SELECT username FROM users WHERE id = ?");
            $stmt->bind_param("i", $target_user_id);
            $stmt->execute();
            $user_data = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            $username = $user_data['username'] ?? 'Doctor';

            $stmt = $conn->prepare("INSERT INTO doctor_profiles (user_id, display_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE display_name = IF(display_name IS NULL OR display_name = '', VALUES(display_name), display_name)");
            $stmt->bind_param("is", $target_user_id, $username);
            $stmt->execute();
            $stmt->close();
        }

        $conn->commit();
        echo json_encode(["status" => "success", "message" => "User role updated to $target_role."]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["status" => "error", "message" => "Error updating role: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
