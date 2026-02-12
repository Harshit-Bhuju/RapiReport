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
$reward_id = (int) ($input['reward_id'] ?? $input['rewardId'] ?? 0);
if (!$reward_id) {
    echo json_encode(['status' => 'error', 'message' => 'reward_id required']);
    exit;
}

$conn->begin_transaction();
try {
    $r = $conn->query("SELECT id, points_required FROM rewards WHERE id = " . (int) $reward_id);
    if (!$r || !$r->num_rows) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Reward not found']);
        exit;
    }
    $reward = $r->fetch_assoc();
    $points_required = (int) $reward['points_required'];

    $tu = $conn->prepare("SELECT id, cumulative_points FROM territory_users WHERE user_id = ?");
    $tu->bind_param('i', $user_id);
    $tu->execute();
    $tr = $tu->get_result();
    $current = 0;
    $tu_id = null;
    if ($tr && $tr->num_rows) {
        $row = $tr->fetch_assoc();
        $current = (int) $row['cumulative_points'];
        $tu_id = (int) $row['id'];
    }
    $tu->close();

    if ($tu_id === null) {
        $conn->query("INSERT INTO territory_users (user_id, username, cumulative_points) SELECT " . (int) $user_id . ", (SELECT username FROM users WHERE id = " . (int) $user_id . "), 0");
        $current = 0;
    }
    if ($current < $points_required) {
        $conn->rollback();
        echo json_encode(['status' => 'error', 'message' => 'Insufficient points', 'required' => $points_required, 'current' => $current]);
        exit;
    }

    $ins = $conn->prepare("INSERT INTO reward_redemptions (user_id, reward_id, points_spent) VALUES (?, ?, ?)");
    $ins->bind_param('iii', $user_id, $reward_id, $points_required);
    $ins->execute();
    $ins->close();

    $conn->query("UPDATE territory_users SET cumulative_points = cumulative_points - " . (int) $points_required . " WHERE user_id = " . (int) $user_id);
    $conn->commit();
    $conn->close();
    echo json_encode(['status' => 'success', 'pointsSpent' => $points_required]);
} catch (Exception $e) {
    $conn->rollback();
    $conn->close();
    echo json_encode(['status' => 'error', 'message' => 'Redemption failed']);
}
