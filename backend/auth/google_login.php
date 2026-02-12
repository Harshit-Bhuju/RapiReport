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

    $google_id = trim($_POST['google_id'] ?? '');
    $email = strtolower(trim(filter_input(INPUT_POST, "email", FILTER_SANITIZE_EMAIL) ?: ($_POST['email'] ?? '')));
    $username = trim($_POST['username'] ?? '');
    $picture = trim($_POST['picture'] ?? '');

    if (empty($google_id) || empty($email)) {
        echo json_encode(["status" => "error", "message" => "Missing required information."]);
        exit;
    }

    // Check if user exists by Google ID first, then by email
    $stmt = $conn->prepare("SELECT * FROM users WHERE google_id = ? OR email = ? LIMIT 1");

    if (!$stmt) {
        error_log("Prepare failed: " . $conn->error);
        echo json_encode(["status" => "error", "message" => "Database error: Cannot prepare user check. Check if 'users' table has all required columns."]);
        exit;
    }

    $stmt->bind_param("ss", $google_id, $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if ($user) {
        // User exists, update their information
        // We use the internal 'id' for the update to be safe
        $stmt = $conn->prepare("UPDATE users SET google_id = ?, email = ?, username = ?, profile_pic = ?, last_login = CURRENT_TIMESTAMP WHERE id = ?");
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Database error: Cannot prepare user update."]);
            exit;
        }
        $stmt->bind_param("ssssi", $google_id, $email, $username, $picture, $user['id']);
        if (!$stmt->execute()) {
            echo json_encode(["status" => "error", "message" => "Failed to update user profile."]);
            exit;
        }
        $stmt->close();

        // Refresh user data after update
        $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->bind_param("i", $user['id']);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();
    } else {
        // New user, create account
        $stmt = $conn->prepare("INSERT INTO users (google_id, email, username, profile_pic, profile_complete) VALUES (?, ?, ?, ?, 0)");
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Database error: Cannot prepare user creation. Error: " . $conn->error]);
            exit;
        }
        $stmt->bind_param("ssss", $google_id, $email, $username, $picture);
        if (!$stmt->execute()) {
            echo json_encode(["status" => "error", "message" => "Failed to create account. Error: " . $stmt->error]);
            exit;
        }
        $user_id = $stmt->insert_id;
        $stmt->close();

        // Fetch the new user
        $stmt = $conn->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        // Also create entry in territory_users if it doesn't exist
        // Wrapped in try-catch to prevent login failure if game tables are missing
        try {
            $stmt = $conn->prepare("INSERT IGNORE INTO territory_users (user_id, username) VALUES (?, ?)");
            if ($stmt) {
                $stmt->bind_param("is", $user_id, $username);
                $stmt->execute();
                $stmt->close();
            }
        } catch (mysqli_sql_exception $e) {
            error_log("Territory table missing or error: " . $e->getMessage());
            // We don't exit here because the main user was created successfully
        }
    }

    if (!$user) {
        echo json_encode(["status" => "error", "message" => "Failed to retrieve user data after login/registration."]);
        exit;
    }

    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['logged_in'] = true;

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
