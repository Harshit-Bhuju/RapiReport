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

    // Capture basic POST data
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

    $conn->begin_transaction();

    try {
        // Update basic user info
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

        $stmt->bind_param("sissssssi", $name, $age, $gender, $conditions, $custom_conditions, $parental_history, $custom_parental_history, $language, $user_id);
        $stmt->execute();
        $stmt->close();

        // Get user role to see if we need to update doctor profile
        $stmt_role = $conn->prepare("SELECT role FROM users WHERE id = ?");
        $stmt_role->bind_param("i", $user_id);
        $stmt_role->execute();
        $user_role = $stmt_role->get_result()->fetch_assoc()['role'];
        $stmt_role->close();

        if ($user_role === 'doctor') {
            $displayName = trim($_POST['displayName'] ?? $name);
            $specialty = trim($_POST['specialty'] ?? '');
            $experience = trim($_POST['experience'] ?? '');
            $rate = trim($_POST['rate'] ?? '');
            $bio = trim($_POST['bio'] ?? '');
            $qualifications = trim($_POST['qualifications'] ?? '');
            $profile_languages = trim($_POST['profile_languages'] ?? '');

            $stmt_doc = $conn->prepare("INSERT INTO doctor_profiles 
                (user_id, display_name, specialty, experience_years, consultation_rate, bio, qualifications, languages) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                display_name = VALUES(display_name),
                specialty = VALUES(specialty),
                experience_years = VALUES(experience_years),
                consultation_rate = VALUES(consultation_rate),
                bio = VALUES(bio),
                qualifications = VALUES(qualifications),
                languages = VALUES(languages)");

            $stmt_doc->bind_param("isssssss", $user_id, $displayName, $specialty, $experience, $rate, $bio, $qualifications, $profile_languages);
            $stmt_doc->execute();
            $stmt_doc->close();
        }

        $conn->commit();

        // Fetch updated user data (including doctor profile)
        $query = "SELECT u.*, dp.specialty, dp.experience_years, dp.consultation_rate, dp.bio, dp.languages as profile_languages, dp.qualifications, dp.display_name
                  FROM users u 
                  LEFT JOIN doctor_profiles dp ON u.id = dp.user_id 
                  WHERE u.id = ?";

        $stmt_get = $conn->prepare($query);
        $stmt_get->bind_param("i", $user_id);
        $stmt_get->execute();
        $user = $stmt_get->get_result()->fetch_assoc();
        $stmt_get->close();

        // Calculate doctorProfileComplete
        $doctorProfileComplete = false;
        if ($user['role'] === 'doctor') {
            $doctorProfileComplete = !empty($user['specialty']) && !empty($user['experience_years']) && !empty($user['display_name']);
        }

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
                "doctorProfileComplete" => $doctorProfileComplete,
                "parent_id" => $user['parent_id'],
                "doctorProfile" => ($user['role'] === 'doctor') ? [
                    "displayName" => $user['display_name'],
                    "specialty" => $user['specialty'],
                    "experience" => $user['experience_years'],
                    "rate" => $user['consultation_rate'],
                    "bio" => $user['bio'],
                    "languages" => $user['profile_languages'],
                    "qualifications" => $user['qualifications']
                ] : null
            ]
        ]);
    } catch (Exception $e) {
        if (isset($conn)) $conn->rollback();
        echo json_encode(["status" => "error", "message" => "Failed to update profile: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

if (isset($conn)) $conn->close();
exit;
