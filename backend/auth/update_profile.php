<?php
require_once __DIR__ . '/../config/session_config.php';
include("../config/dbconnect.php");
include("../config/header.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if we got JSON data (common with Axios)
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input) {
        $_POST = $input;
    }

    $user_id = $_SESSION['user_id'] ?? null;

    if (!$user_id) {
        echo json_encode(["status" => "error", "message" => "Unauthorized."]);
        exit;
    }

    // Capture POST data
    $name = trim($_POST['name'] ?? '');
    $age = !empty($_POST['age']) ? intval($_POST['age']) : null;
    $gender = trim($_POST['gender'] ?? '');
    $language = trim($_POST['language'] ?? 'en');

    // JSON data (arrays from frontend)
    $conditions = $_POST['conditions'] ?? '[]';
    $custom_conditions = trim($_POST['customConditions'] ?? '');
    $parental_history = $_POST['parentalHistory'] ?? '[]';
    $custom_parental_history = trim($_POST['customParentalHistory'] ?? '');

    // Handle JSON if it comes as a string from FormData or raw JSON
    if (is_array($conditions)) $conditions = json_encode($conditions);
    if (is_array($parental_history)) $parental_history = json_encode($parental_history);

    $stmt = $conn->prepare("UPDATE users SET 
        username = ?, 
        age = ?, 
        gender = ?, 
        conditions = ?, 
        custom_conditions = ?, 
        parental_history = ?, 
        custom_parental_history = ?, 
        preferred_language = ?, 
        profile_complete = 1 
        WHERE id = ?");

    $stmt->bind_param(
        "sissssssi",
        $name,
        $age,
        $gender,
        $conditions,
        $custom_conditions,
        $parental_history,
        $custom_parental_history,
        $language,
        $user_id
    );

    if ($stmt->execute()) {
        // Fetch updated user data
        $stmt_get = $conn->prepare("SELECT * FROM users WHERE id = ?");
        $stmt_get->bind_param("i", $user_id);
        $stmt_get->execute();
        $user = $stmt_get->get_result()->fetch_assoc();

        echo json_encode([
            "status" => "success",
            "message" => "Profile updated successfully.",
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
        echo json_encode(["status" => "error", "message" => "Failed to update profile."]);
    }

    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
