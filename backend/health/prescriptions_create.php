<?php
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';
include __DIR__ . '/../config/header.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$note = trim($input['note'] ?? '');
$raw_text = trim($input['rawText'] ?? $input['raw_text'] ?? '');
$meds = $input['meds'] ?? [];

$stmt = $conn->prepare("INSERT INTO prescriptions (user_id, note, raw_text) VALUES (?, ?, ?)");
$stmt->bind_param('iss', $user_id, $note, $raw_text);
if (!$stmt->execute()) {
    $stmt->close();
    $conn->close();
    echo json_encode(['status' => 'error', 'message' => 'Failed to save']);
    exit;
}
$prescription_id = (int) $conn->insert_id;
$stmt->close();

foreach ($meds as $m) {
    $name = $m['name'] ?? '';
    $dose = $m['dose'] ?? null;
    $frequency = $m['frequency'] ?? null;
    $duration = $m['duration'] ?? null;
    $raw_line = $m['raw'] ?? $m['raw_line'] ?? null;
    $ins = $conn->prepare("INSERT INTO prescription_medicines (prescription_id, name, dose, frequency, duration, raw_line) VALUES (?, ?, ?, ?, ?, ?)");
    $ins->bind_param('isssss', $prescription_id, $name, $dose, $frequency, $duration, $raw_line);
    $ins->execute();
    $ins->close();
}

$conn->close();
echo json_encode(['status' => 'success', 'id' => $prescription_id]);
