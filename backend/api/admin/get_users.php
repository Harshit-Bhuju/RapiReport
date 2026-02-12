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
    $result = $conn->query("SELECT id, email, username, role, profile_pic FROM users ORDER BY created_at DESC");
    $users = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
    }

    echo json_encode(["status" => "success", "users" => $users]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
