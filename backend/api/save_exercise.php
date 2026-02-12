<?php
require_once __DIR__ . '/../config/session_config.php';
include("../config/dbconnect.php");
include("../config/header.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input) {
        $_POST = $input;
    }

    $user_id = $_POST['user_id'] ?? ($_SESSION['user_id'] ?? null);
    $exercise_type = trim($_POST['exercise_type'] ?? '');
    $rep_count = intval($_POST['rep_count'] ?? 0);
    $duration = intval($_POST['duration_seconds'] ?? 0);
    $calories = floatval($_POST['calories_burned'] ?? 0);
    $verified = isset($_POST['verified']) ? (bool)$_POST['verified'] : false;

    if (!$user_id || empty($exercise_type) || ($rep_count <= 0 && $duration <= 0)) {
        echo json_encode(["status" => "error", "message" => "Missing required data."]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO exercise_logs (user_id, exercise_type, rep_count, duration_seconds, calories_burned, video_verified) VALUES (?, ?, ?, ?, ?, ?)");
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
        exit;
    }

    $stmt->bind_param("isiidi", $user_id, $exercise_type, $rep_count, $duration, $calories, $verified);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Exercise logged successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to log exercise."]);
    }

    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
