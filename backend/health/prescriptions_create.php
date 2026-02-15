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

// Handle both JSON and FormData (same pattern as reports_create.php)
$note = '';
$raw_text = '';
$meds = [];
$image_path = null;

$is_form_data = (isset($_POST['note']) || isset($_POST['rawText']) || isset($_POST['meds']))
    || (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE);

if ($is_form_data) {
    // FormData submission
    $note = trim($_POST['note'] ?? '');
    $raw_text = trim($_POST['rawText'] ?? $_POST['raw_text'] ?? '');
    $meds_raw = $_POST['meds'] ?? '[]';
    $meds = is_array($meds_raw) ? $meds_raw : (json_decode($meds_raw, true) ?: []);

    // Handle image upload (same as reports)
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = __DIR__ . '/../uploads/prescriptions/';

        // Create directory if it doesn't exist
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        // Validate file type
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png'];
        $file_type = $_FILES['image']['type'];

        if (!in_array($file_type, $allowed_types)) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid file type. Only JPG and PNG allowed.']);
            exit;
        }

        // Validate file size (5MB max)
        if ($_FILES['image']['size'] > 5 * 1024 * 1024) {
            echo json_encode(['status' => 'error', 'message' => 'File too large. Max 5MB.']);
            exit;
        }

        // Generate unique filename (stored path: filename only for API serve)
        $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $filename = uniqid('rx_', true) . '.' . strtolower($ext);
        $full_path = $upload_dir . $filename;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $full_path)) {
            $image_path = $filename; // Store filename; serve script uses it
        }
    }
} else {
    // JSON submission (fallback)
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $note = trim($input['note'] ?? '');
    $raw_text = trim($input['rawText'] ?? $input['raw_text'] ?? '');
    $meds = $input['meds'] ?? [];
}

// Save to ocr_history instead of legacy prescriptions table

// Save to ocr_history instead of prescriptions
$meds_json = json_encode($meds);
$sql = "INSERT INTO ocr_history (user_id, image_path, note, raw_text, refined_json) VALUES (?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$img_val = $image_path ?? '';
$stmt->bind_param('issss', $user_id, $img_val, $note, $raw_text, $meds_json);

if (!$stmt->execute()) {
    $stmt->close();
    $conn->close();
    echo json_encode(['status' => 'error', 'message' => 'Failed to save to ocr_history: ' . $conn->error]);
    exit;
}
$history_id = (int) $conn->insert_id;
$stmt->close();

$conn->close();
echo json_encode(['status' => 'success', 'id' => $history_id, 'image_path' => $image_path]);
