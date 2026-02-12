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

// Check if this is multipart/form-data (with image upload)
if (isset($_POST['note']) || isset($_POST['rawText'])) {
    // FormData submission
    $note = trim($_POST['note'] ?? '');
    $raw_text = trim($_POST['rawText'] ?? $_POST['raw_text'] ?? '');
    $meds = isset($_POST['meds']) ? json_decode($_POST['meds'], true) : [];

    // Handle image upload
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

        // Generate unique filename
        $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $filename = uniqid('rx_', true) . '.' . $extension;
        $full_path = $upload_dir . $filename;

        // Move uploaded file
        if (move_uploaded_file($_FILES['image']['tmp_name'], $full_path)) {
            $image_path = 'backend/uploads/prescriptions/' . $filename;
        }
    }
} else {
    // JSON submission (fallback)
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $note = trim($input['note'] ?? '');
    $raw_text = trim($input['rawText'] ?? $input['raw_text'] ?? '');
    $meds = $input['meds'] ?? [];
}

// Check if image_path column exists (for older DB schemas)
$hasImagePath = false;
$cols = $conn->query("SHOW COLUMNS FROM prescriptions LIKE 'image_path'");
if ($cols && $cols->num_rows > 0) {
    $hasImagePath = true;
}

if ($hasImagePath) {
    $stmt = $conn->prepare("INSERT INTO prescriptions (user_id, note, raw_text, image_path) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('isss', $user_id, $note, $raw_text, $image_path);
} else {
    $stmt = $conn->prepare("INSERT INTO prescriptions (user_id, note, raw_text) VALUES (?, ?, ?)");
    $stmt->bind_param('iss', $user_id, $note, $raw_text);
}
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
echo json_encode(['status' => 'success', 'id' => $prescription_id, 'image_path' => $image_path]);
