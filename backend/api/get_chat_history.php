<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include(__DIR__ . '/../config/dbconnect.php');
include(__DIR__ . '/../config/header.php');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Unauthorized. Please login to view chat history."]);
    exit;
}

$user_id = $_SESSION['user_id'];

// Fetch last 50 messages
$stmt = $conn->prepare("SELECT role, content_en, content_ne, created_at FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 50");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$messages = [];
while ($row = $result->fetch_assoc()) {
    $messages[] = [
        "role" => $row['role'],
        "text" => [
            "en" => $row['content_en'],
            "ne" => $row['content_ne']
        ],
        "timestamp" => $row['created_at']
    ];
}

$stmt->close();
$conn->close();

echo json_encode($messages);
