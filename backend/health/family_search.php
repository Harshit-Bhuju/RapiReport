<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include __DIR__ . '/../config/dbconnect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$email = isset($_GET['email']) ? trim($_GET['email']) : '';

if (empty($email) || strlen($email) < 3) {
    echo json_encode(['status' => 'success', 'data' => []]);
    exit;
}

// Search for users by email (partial match), exclude the current user
$searchPattern = '%' . $email . '%';
$stmt = $conn->prepare("SELECT id, username, email, profile_picture FROM users WHERE email LIKE ? AND id != ? LIMIT 10");
$stmt->bind_param("si", $searchPattern, $user_id);
$stmt->execute();
$result = $stmt->get_result();

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = [
        'id' => $row['id'],
        'username' => $row['username'],
        'email' => $row['email'],
        'profile_picture' => $row['profile_picture'],
    ];
}

echo json_encode(['status' => 'success', 'data' => $users]);
?>
