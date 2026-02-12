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
$symptoms_text = trim($input['symptoms_text'] ?? $input['symptomsText'] ?? '');
$vitals_json = isset($input['vitals']) ? json_encode($input['vitals']) : null;
$diet_activity_note = trim($input['diet_activity_note'] ?? $input['dietActivityNote'] ?? '');

$stmt = $conn->prepare("INSERT INTO async_consultation_requests (patient_user_id, symptoms_text, vitals_json, diet_activity_note, status) VALUES (?, ?, ?, ?, 'pending')");
$stmt->bind_param('isss', $user_id, $symptoms_text, $vitals_json, $diet_activity_note);
$stmt->execute();
$id = (int) $conn->insert_id;
$stmt->close();
$conn->close();

echo json_encode(['status' => 'success', 'id' => $id]);
