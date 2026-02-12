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

$stmt = $conn->prepare("SELECT id, title, points_required, icon, category FROM rewards ORDER BY points_required ASC");
$stmt->execute();
$result = $stmt->get_result();
$list = [];
while ($row = $result->fetch_assoc()) {
    $list[] = [
        'id' => (int) $row['id'],
        'title' => $row['title'],
        'pointsRequired' => (int) $row['points_required'],
        'icon' => $row['icon'],
        'category' => $row['category'],
    ];
}
$stmt->close();

// User's current points from territory
$points = 0;
$tu = $conn->prepare("SELECT cumulative_points FROM territory_users WHERE user_id = ?");
$tu->bind_param('i', $user_id);
$tu->execute();
$tr = $tu->get_result();
if ($tr && $tr->num_rows) {
    $points = (int) $tr->fetch_assoc()['cumulative_points'];
}
$tu->close();
$conn->close();

echo json_encode(['status' => 'success', 'data' => $list, 'userPoints' => $points]);
