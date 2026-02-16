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

// Handle both JSON and FormData
$note = '';
$raw_text = '';
$meds = [];
$image_path = null;
$image_hash = null;

$is_form_data = (isset($_POST['note']) || isset($_POST['rawText']) || isset($_POST['meds']))
    || (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE);

if ($is_form_data) {
    $note = trim($_POST['note'] ?? '');
    $raw_text = trim($_POST['rawText'] ?? $_POST['raw_text'] ?? '');
    $meds_raw = $_POST['meds'] ?? '[]';
    $meds = is_array($meds_raw) ? $meds_raw : (json_decode($meds_raw, true) ?: []);
    $image_hash = $_POST['imageHash'] ?? null;

    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = __DIR__ . '/../uploads/ocr/';
        if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);

        if (!$image_hash) $image_hash = md5_file($_FILES['image']['tmp_name']);

        $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $filename = uniqid('ocr_', true) . '.' . strtolower($ext);
        if (move_uploaded_file($_FILES['image']['tmp_name'], $upload_dir . $filename)) {
            $image_path = $filename;
        }
    }
} else {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $note = trim($input['note'] ?? '');
    $raw_text = trim($input['rawText'] ?? $input['raw_text'] ?? '');
    $meds = $input['meds'] ?? [];
    $image_hash = $input['imageHash'] ?? null;
}

// Check for existing scan with same hash to avoid duplicates
if ($image_hash) {
    $check = $conn->prepare("SELECT id, image_path FROM ocr_history WHERE image_hash = ? AND user_id = ? LIMIT 1");
    $check->bind_param("si", $image_hash, $user_id);
    $check->execute();
    $existing = $check->get_result()->fetch_assoc();
    $check->close();

    if ($existing) {
        $history_id = $existing['id'];
        $meds_json = json_encode($meds);
        $sql = "UPDATE ocr_history SET note = ?, raw_text = ?, refined_json = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('sssi', $note, $raw_text, $meds_json, $history_id);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['status' => 'success', 'id' => $history_id, 'updated' => true, 'image_path' => $existing['image_path']]);
        exit;
    }
}

$meds_json = json_encode($meds);
$sql = "INSERT INTO ocr_history (user_id, image_path, image_hash, note, raw_text, refined_json) VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$img_val = $image_path ?? '';
$hash_val = $image_hash ?? '';
$stmt->bind_param('isssss', $user_id, $img_val, $hash_val, $note, $raw_text, $meds_json);

if (!$stmt->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save: ' . $conn->error]);
    exit;
}

echo json_encode(['status' => 'success', 'id' => $conn->insert_id, 'image_path' => $image_path]);
