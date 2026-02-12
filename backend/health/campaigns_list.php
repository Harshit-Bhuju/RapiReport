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

$stmt = $conn->prepare("SELECT id, type, title, description, points, deadline, cta FROM campaigns ORDER BY deadline ASC");
$stmt->execute();
$result = $stmt->get_result();
$list = [];
while ($row = $result->fetch_assoc()) {
    $list[] = [
        'id' => $row['id'],
        'type' => $row['type'],
        'title' => $row['title'],
        'description' => $row['description'],
        'points' => (int) $row['points'],
        'deadline' => $row['deadline'],
        'cta' => $row['cta'],
    ];
}
$stmt->close();

$completed = [];
$c = $conn->prepare("SELECT campaign_id FROM campaign_completions WHERE user_id = ?");
$c->bind_param('i', $user_id);
$c->execute();
$cr = $c->get_result();
while ($r = $cr->fetch_assoc()) {
    $completed[] = $r['campaign_id'];
}
$c->close();
$conn->close();

echo json_encode(['status' => 'success', 'data' => $list, 'completedIds' => $completed]);
