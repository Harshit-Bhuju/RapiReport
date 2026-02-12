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
    $stmt = $conn->prepare("SELECT id, log_date as date, meal_type, items, note, created_at FROM diet_logs WHERE user_id = ? ORDER BY log_date DESC, created_at DESC LIMIT 500");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $list = [];
    while ($row = $result->fetch_assoc()) {
        $list[] = [
            'id' => (string) $row['id'],
            'date' => $row['date'],
            'mealType' => $row['meal_type'],
            'items' => $row['items'],
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
        $del = $conn->prepare("DELETE FROM diet_logs WHERE id = ? AND user_id = ?");
        $del->bind_param('ii', $id, $user_id);
        $del->execute();
        $del->close();
        $conn->close();
        echo json_encode(['status' => 'success']);
        exit;
    }
    $date = $input['date'] ?? date('Y-m-d');
    $meal_type = trim($input['mealType'] ?? $input['meal_type'] ?? 'breakfast');
    $items = trim($input['items'] ?? '');
    $note = trim($input['note'] ?? '');
    if (!$items) {
        echo json_encode(['status' => 'error', 'message' => 'items required']);
        exit;
    }
    $stmt = $conn->prepare("INSERT INTO diet_logs (user_id, log_date, meal_type, items, note) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('issss', $user_id, $date, $meal_type, $items, $note);
    $stmt->execute();
    $id = (int) $conn->insert_id;
    $stmt->close();
    $conn->close();
    echo json_encode(['status' => 'success', 'id' => $id]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
