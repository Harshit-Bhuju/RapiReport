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
    $stmt = $conn->prepare("SELECT id, medicine_name, slot, reminder_time, enabled FROM adherence_reminders WHERE user_id = ? ORDER BY id ASC");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $list = [];
    while ($row = $result->fetch_assoc()) {
        $list[] = [
            'id' => (string) $row['id'],
            'medicineName' => $row['medicine_name'],
            'slot' => $row['slot'],
            'time' => substr($row['reminder_time'], 0, 5),
            'enabled' => (bool) $row['enabled'],
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
        $del = $conn->prepare("DELETE FROM adherence_reminders WHERE id = ? AND user_id = ?");
        $del->bind_param('ii', $id, $user_id);
        $del->execute();
        $del->close();
        $conn->close();
        echo json_encode(['status' => 'success']);
        exit;
    }
    if (isset($input['toggle_id'])) {
        $id = (int) $input['toggle_id'];
        $up = $conn->prepare("UPDATE adherence_reminders SET enabled = NOT enabled WHERE id = ? AND user_id = ?");
        $up->bind_param('ii', $id, $user_id);
        $up->execute();
        $up->close();
        $conn->close();
        echo json_encode(['status' => 'success']);
        exit;
    }
    $medicine_name = trim($input['medicineName'] ?? $input['medicine_name'] ?? '');
    $slot = trim($input['slot'] ?? 'morning');
    $time = $input['time'] ?? '08:00';
    if (!$medicine_name) {
        echo json_encode(['status' => 'error', 'message' => 'medicineName required']);
        exit;
    }
    $stmt = $conn->prepare("INSERT INTO adherence_reminders (user_id, medicine_name, slot, reminder_time, enabled) VALUES (?, ?, ?, ?, 1)");
    $stmt->bind_param('isss', $user_id, $medicine_name, $slot, $time);
    $stmt->execute();
    $id = (int) $conn->insert_id;
    $stmt->close();
    $conn->close();
    echo json_encode(['status' => 'success', 'id' => $id]);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
