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
    if ($input) {
        $_POST = $input;
    }

    $email = strtolower(trim($_POST['email'] ?? ''));
    $username = trim($_POST['username'] ?? '');
    $specialty = trim($_POST['specialty'] ?? 'General Physician');
    $experience_years = intval($_POST['experience_years'] ?? 0);
    $consultation_rate = intval($_POST['consultation_rate'] ?? 0);
    $bio = trim($_POST['bio'] ?? '');
    $profile_pic = trim($_POST['profile_pic'] ?? '');

    if (empty($email) || empty($username)) {
        echo json_encode(["status" => "error", "message" => "Email and Username are required."]);
        exit;
    }

    // Check if user already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $existing_user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $conn->begin_transaction();

    try {
        if ($existing_user) {
            $doctor_user_id = $existing_user['id'];
            // Update role to doctor
            $stmt = $conn->prepare("UPDATE users SET role = 'doctor', username = ?, profile_pic = IF(? != '', ?, profile_pic) WHERE id = ?");
            $stmt->bind_param("sssi", $username, $profile_pic, $profile_pic, $doctor_user_id);
            $stmt->execute();
            $stmt->close();
        } else {
            // Create new doctor user
            $google_id = "DOCTOR_" . time(); // Dummy google_id for internal doctors
            $stmt = $conn->prepare("INSERT INTO users (google_id, email, username, profile_pic, role, profile_complete) VALUES (?, ?, ?, ?, 'doctor', 1)");
            $stmt->bind_param("ssss", $google_id, $email, $username, $profile_pic);
            $stmt->execute();
            $doctor_user_id = $conn->insert_id;
            $stmt->close();
        }

        // Create or update doctor_profile
        $stmt = $conn->prepare("INSERT INTO doctor_profiles (user_id, display_name, specialty, experience_years, consultation_rate, bio) 
                                VALUES (?, ?, ?, ?, ?, ?) 
                                ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), specialty = VALUES(specialty), experience_years = VALUES(experience_years), consultation_rate = VALUES(consultation_rate), bio = VALUES(bio)");
        $stmt->bind_param("issiis", $doctor_user_id, $username, $specialty, $experience_years, $consultation_rate, $bio);
        $stmt->execute();
        $stmt->close();

        $conn->commit();
        echo json_encode(["status" => "success", "message" => "Consultant created/updated successfully.", "doctor_id" => $doctor_user_id]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["status" => "error", "message" => "Error creating consultant: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
