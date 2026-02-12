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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$campaign_id = trim($input['campaign_id'] ?? $input['campaignId'] ?? '');
if (!$campaign_id) {
    echo json_encode(['status' => 'error', 'message' => 'campaign_id required']);
    exit;
}

$conn->begin_transaction();
try {
    $r = $conn->prepare("SELECT id, points FROM campaigns WHERE id = ?");
    $r->bind_param('s', $campaign_id);
    $r->execute();
    $res = $r->get_result();
    if (!$res || !$res->num_rows) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Campaign not found']);
        exit;
    }
    $camp = $res->fetch_assoc();
    $points = (int) $camp['points'];
    $r->close();

    $ins = $conn->prepare("INSERT IGNORE INTO campaign_completions (user_id, campaign_id) VALUES (?, ?)");
    $ins->bind_param('is', $user_id, $campaign_id);
    $ins->execute();
    if ($conn->affected_rows === 0) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Already completed']);
        exit;
    }
    $ins->close();

    $conn->query("INSERT INTO territory_users (user_id, username, cumulative_points) SELECT " . (int) $user_id . ", (SELECT username FROM users WHERE id = " . (int) $user_id . "), " . (int) $points . " ON DUPLICATE KEY UPDATE cumulative_points = cumulative_points + " . (int) $points);
    $conn->commit();
    $conn->close();
    echo json_encode(['status' => 'success', 'pointsAwarded' => $points]);
} catch (Exception $e) {
    $conn->rollback();
    $conn->close();
    echo json_encode(['status' => 'error', 'message' => 'Failed']);
}
