<?php
require_once __DIR__ . '/../config/session_config.php';
include("../config/dbconnect.php");
include("../config/header.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $google_id = trim($_POST['google_id'] ?? '');
    $email = strtolower(trim(filter_input(INPUT_POST, "email", FILTER_SANITIZE_EMAIL)));
    $username = trim($_POST['username'] ?? '');
    $picture = trim($_POST['picture'] ?? '');

    if (empty($google_id) || empty($email)) {
        echo json_encode(["status" => "error", "message" => "Missing required information."]);
        exit;
    }

    // Check if user exists
    $stmt = $conn->prepare("SELECT id, google_id, username, profile_pic FROM users WHERE google_id = ? OR email = ? LIMIT 1");
    $stmt->bind_param("ss", $google_id, $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if ($user) {
        // User exists, update info if needed
        $stmt = $conn->prepare("UPDATE users SET email = ?, username = ?, profile_pic = ?, last_login = CURRENT_TIMESTAMP WHERE google_id = ?");
        $stmt->bind_param("ssss", $email, $username, $picture, $google_id);
        $stmt->execute();
        $stmt->close();
    } else {
        // New user, create account
        $stmt = $conn->prepare("INSERT INTO users (google_id, email, username, profile_pic) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $google_id, $email, $username, $picture);
        $stmt->execute();
        $user_id = $stmt->insert_id;
        $stmt->close();
        
        // Also create entry in territory_users if it doesn't exist
        $stmt = $conn->prepare("INSERT IGNORE INTO territory_users (user_id, username) VALUES (?, ?)");
        $stmt->bind_param("is", $user_id, $username);
        $stmt->execute();
        $stmt->close();
    }

    // Set session
    $_SESSION['user_id'] = $user ? $user['id'] : $user_id;
    $_SESSION['user_email'] = $email;
    $_SESSION['logged_in'] = true;

    echo json_encode([
        "status" => "success",
        "user" => [
            "id" => $_SESSION['user_id'],
            "email" => $email,
            "name" => $username,
            "avatar" => $picture
        ]
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
