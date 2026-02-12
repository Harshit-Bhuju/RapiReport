<?php
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';
include __DIR__ . '/../config/header.php';

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

// Fetch redemption history with reward details
$stmt = $conn->prepare("
    SELECT 
        rr.id, 
        rr.points_spent, 
        rr.created_at,
        r.title as reward_title,
        r.icon as reward_icon,
        r.category as reward_category
    FROM reward_redemptions rr
    JOIN rewards r ON rr.reward_id = r.id
    WHERE rr.user_id = ?
    ORDER BY rr.created_at DESC
");

if (!$stmt) {
     echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
     exit;
}


$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();

$history = [];
while ($row = $result->fetch_assoc()) {
    $history[] = [
        'id' => (int) $row['id'],
        'pointsSpent' => (int) $row['points_spent'],
        'date' => $row['created_at'],
        'rewardTitle' => $row['reward_title'],
        'rewardIcon' => $row['reward_icon'],
        'rewardCategory' => $row['reward_category'],
    ];
}
$stmt->close();
$conn->close();

echo json_encode(['status' => 'success', 'data' => $history]);
