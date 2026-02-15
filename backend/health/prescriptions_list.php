<?php
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';
include __DIR__ . '/../config/header.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$hasImagePath = false;
$cols = $conn->query("SHOW COLUMNS FROM prescriptions LIKE 'image_path'");
if ($cols && $cols->num_rows > 0) $hasImagePath = true;
$colsStr = $hasImagePath ? "id, user_id, doctor_user_id, note, raw_text, image_path, created_at" : "id, user_id, doctor_user_id, note, raw_text, created_at";
$stmt = $conn->prepare("SELECT $colsStr FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC");
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();
$list = [];
while ($row = $result->fetch_assoc()) {
    $id = (int) $row['id'];
    $medsStmt = $conn->prepare("SELECT name, dose, frequency, duration, raw_line FROM prescription_medicines WHERE prescription_id = ?");
    $medsStmt->bind_param('i', $id);
    $medsStmt->execute();
    $medsResult = $medsStmt->get_result();
    $meds = [];
    while ($m = $medsResult->fetch_assoc()) {
        $meds[] = ['name' => $m['name'], 'dose' => $m['dose'], 'frequency' => $m['frequency'], 'duration' => $m['duration'], 'raw' => $m['raw_line']];
    }
    $medsStmt->close();
    $list[] = [
        'id' => (string) $id,
        'user_id' => (int) $row['user_id'],
        'doctor_user_id' => $row['doctor_user_id'] ? (int) $row['doctor_user_id'] : null,
        'note' => $row['note'],
        'rawText' => $row['raw_text'],
        'imagePath' => ($hasImagePath && isset($row['image_path'])) ? $row['image_path'] : null,
        'createdAt' => $row['created_at'],
        'meds' => $meds,
    ];
}
$stmt->close();
$conn->close();
echo json_encode(['status' => 'success', 'data' => $list]);
