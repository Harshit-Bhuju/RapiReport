<?php
require_once __DIR__ . '/../config/session_config.php';
include("../config/dbconnect.php");
include("../config/header.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = $_SESSION['user_id'] ?? null;

    if (!$user_id) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Database error."]);
        exit;
    }

    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "user" => [
            "id" => $user['id'],
            "email" => $user['email'],
            "name" => $user['username'],
            "avatar" => $user['profile_pic'],
            "role" => $user['role'],
            "age" => $user['age'],
            "gender" => $user['gender'],
            "conditions" => json_decode($user['conditions'] ?? '[]', true),
            "customConditions" => $user['custom_conditions'],
            "parentalHistory" => json_decode($user['parental_history'] ?? '[]', true),
            "customParentalHistory" => $user['custom_parental_history'],
            "language" => $user['preferred_language'],
            "profileComplete" => (bool)$user['profile_complete'],
            "parent_id" => $user['parent_id']
        ]
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
