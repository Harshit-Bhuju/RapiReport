<?php
require_once __DIR__ . '/../config/session_config.php';
require_once("../config/dbconnect.php");
require_once("../config/header.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user_id = $_SESSION['user_id'] ?? null;

    if (!$user_id) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized."]);
        exit;
    }

    // Fetch user with potential doctor profile details
    $query = "SELECT u.*, dp.specialty, dp.experience_years, dp.consultation_rate, dp.bio, dp.languages as profile_languages, dp.qualifications, dp.display_name, dp.availability_json
              FROM users u 
              LEFT JOIN doctor_profiles dp ON u.id = dp.user_id 
              WHERE u.id = ?";

    $stmt = $conn->prepare($query);
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

    $profileComplete = (bool)$user['profile_complete'];
    $doctorProfileComplete = false;
    if ($user['role'] === 'doctor') {
        $doctorProfileComplete = !empty($user['specialty']) && !empty($user['experience_years']) && !empty($user['display_name']);
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
            "profileComplete" => $profileComplete,
            "doctorProfileComplete" => $doctorProfileComplete,
            "parent_id" => $user['parent_id'],
            // Doctor profile fields
            "doctorProfile" => ($user['role'] === 'doctor') ? [
                "displayName" => $user['display_name'],
                "specialty" => $user['specialty'],
                "experience" => $user['experience_years'],
                "rate" => $user['consultation_rate'],
                "bio" => $user['bio'],
                "languages" => $user['profile_languages'],
                "qualifications" => $user['qualifications'],
                "availability_json" => json_decode($user['availability_json'] ?? '[]', true)
            ] : null
        ]
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
