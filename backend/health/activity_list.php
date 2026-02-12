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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("SELECT id, log_date as date, type, value, unit, note, created_at FROM activity_logs WHERE user_id = ? ORDER BY log_date DESC, created_at DESC LIMIT 500");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $list = [];
    while ($row = $result->fetch_assoc()) {
        $list[] = [
            'id' => (string) $row['id'],
            'date' => $row['date'],
            'type' => $row['type'],
            'value' => (float) $row['value'],
            'unit' => $row['unit'],
            'note' => $row['note'],
            'createdAt' => $row['created_at'],
        ];
    }
    $stmt->close();
    $conn->close();
    echo json_encode(['status' => 'success', 'data' => $list]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    if (!empty($input['delete_id'])) {
        $id = (int) $input['delete_id'];
        $del = $conn->prepare("DELETE FROM activity_logs WHERE id = ? AND user_id = ?");
        $del->bind_param('ii', $id, $user_id);
        $del->execute();
        $del->close();
        $conn->close();
        echo json_encode(['status' => 'success']);
        exit;
    }
    $date = $input['date'] ?? date('Y-m-d');
    $type = trim($input['type'] ?? 'steps');
    $value = (float) ($input['value'] ?? 0);
    $unit = trim($input['unit'] ?? '');
    $note = trim($input['note'] ?? '');
    if ($value <= 0) {
        echo json_encode(['status' => 'error', 'message' => 'value required']);
        exit;
    }
    $stmt = $conn->prepare("INSERT INTO activity_logs (user_id, log_date, type, value, unit, note) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('issdss', $user_id, $date, $type, $value, $unit, $note);
    $stmt->execute();
    $id = (int) $conn->insert_id;
    $stmt->close();
    $conn->close();
    echo json_encode(['status' => 'success', 'id' => $id]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
