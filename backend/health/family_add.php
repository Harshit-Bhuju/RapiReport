<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include __DIR__ . '/../config/dbconnect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];
$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true) ?: [];

$email = isset($data['email']) ? trim($data['email']) : '';
$relation = isset($data['relation']) ? trim($data['relation']) : '';

if (empty($email)) {
    echo json_encode(['status' => 'error', 'message' => 'Email is required']);
    exit;
}

// Look up the user by email
$stmt = $conn->prepare("SELECT id, username, email, profile_picture FROM users WHERE email = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$target = $result->fetch_assoc();

if (!$target) {
    echo json_encode(['status' => 'error', 'message' => 'No user found with that email']);
    exit;
}

if ((int)$target['id'] === (int)$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'You cannot add yourself']);
    exit;
}

// Check if already linked
$stmt2 = $conn->prepare("SELECT id FROM family_members WHERE user_id = ? AND member_user_id = ?");
$stmt2->bind_param("ii", $user_id, $target['id']);
$stmt2->execute();
if ($stmt2->get_result()->num_rows > 0) {
    echo json_encode(['status' => 'error', 'message' => 'This member is already in your family']);
    exit;
}

// Insert the link
$stmt3 = $conn->prepare("INSERT INTO family_members (user_id, member_user_id, relation, status) VALUES (?, ?, ?, 'accepted')");
$stmt3->bind_param("iis", $user_id, $target['id'], $relation);
$stmt3->execute();

echo json_encode([
    'status' => 'success',
    'message' => 'Family member added',
    'member' => [
        'link_id' => $stmt3->insert_id,
        'member_id' => $target['id'],
        'username' => $target['username'],
        'email' => $target['email'],
        'profile_picture' => $target['profile_picture'],
        'relation' => $relation,
        'status' => 'accepted',
    ]
]);
?>
