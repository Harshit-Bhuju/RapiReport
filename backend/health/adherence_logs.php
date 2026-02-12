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
    $stmt = $conn->prepare("SELECT id, log_date as date, medicine_name, slot, taken, created_at FROM adherence_logs WHERE user_id = ? ORDER BY log_date DESC, created_at DESC LIMIT 500");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $list = [];
    while ($row = $result->fetch_assoc()) {
        $list[] = [
            'id' => (string) $row['id'],
            'date' => $row['date'],
            'medicineName' => $row['medicine_name'],
            'slot' => $row['slot'],
            'taken' => (bool) $row['taken'],
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
    if (isset($input['update_id'], $input['taken'])) {
        $id = (int) $input['update_id'];
        $taken = !empty($input['taken']) ? 1 : 0;
        $up = $conn->prepare("UPDATE adherence_logs SET taken = ? WHERE id = ? AND user_id = ?");
        $up->bind_param('iii', $taken, $id, $user_id);
        $up->execute();
        $up->close();
        $conn->close();
        echo json_encode(['status' => 'success']);
        exit;
    }
    $date = $input['date'] ?? date('Y-m-d');
    $medicine_name = trim($input['medicineName'] ?? $input['medicine_name'] ?? '');
    $slot = trim($input['slot'] ?? 'morning');
    $taken = !empty($input['taken']) ? 1 : 0;
    if (!$medicine_name) {
        echo json_encode(['status' => 'error', 'message' => 'medicineName required']);
        exit;
    }
    $stmt = $conn->prepare("INSERT INTO adherence_logs (user_id, log_date, medicine_name, slot, taken) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param('isssi', $user_id, $date, $medicine_name, $slot, $taken);
    $stmt->execute();
    $id = (int) $conn->insert_id;
    $stmt->close();
    $conn->close();
    echo json_encode(['status' => 'success', 'id' => $id]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
