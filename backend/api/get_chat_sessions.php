<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include(__DIR__ . '/../config/dbconnect.php');
include(__DIR__ . '/../config/header.php');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized. Please login to view chat sessions."]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch all sessions for the user, ordered by most recent first
$stmt = $conn->prepare("SELECT id, title, created_at FROM chat_sessions WHERE user_id = ? ORDER BY created_at DESC");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$sessions = [];
while ($row = $result->fetch_assoc()) {
    $sessions[] = [
        "id" => $row['id'],
        "title" => $row['title'],
        "timestamp" => $row['created_at']
    ];
}

$stmt->close();
$conn->close();

echo json_encode($sessions);
