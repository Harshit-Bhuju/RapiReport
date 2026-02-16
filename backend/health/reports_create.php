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
$lab_name = trim($input['labName'] ?? $_POST['labName'] ?? '');
$report_type = trim($input['reportType'] ?? $_POST['reportType'] ?? 'Lab Report');
$report_date = !empty($input['reportDate']) ? $input['reportDate'] : (!empty($_POST['reportDate']) ? $_POST['reportDate'] : null);
$raw_text = trim($input['rawText'] ?? $_POST['rawText'] ?? '');
$ai_summary_en = trim($input['aiSummaryEn'] ?? $_POST['aiSummaryEn'] ?? '');
$ai_summary_ne = trim($input['aiSummaryNe'] ?? $_POST['aiSummaryNe'] ?? '');
$overall_status = trim($input['overallStatus'] ?? $_POST['overallStatus'] ?? 'normal');
$tests = $input['tests'] ?? (isset($_POST['tests']) ? json_decode($_POST['tests'], true) : []);
$image_hash = $input['imageHash'] ?? $_POST['imageHash'] ?? null;
$image_path = null;

if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = __DIR__ . '/../uploads/reports/';
    if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);

    if (!$image_hash) $image_hash = md5_file($_FILES['image']['tmp_name']);

    $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename = uniqid('rpt_', true) . '.' . $ext;
    if (move_uploaded_file($_FILES['image']['tmp_name'], $upload_dir . $filename)) {
        $image_path = 'backend/uploads/reports/' . $filename;
    }
}

// Deduplication
if ($image_hash) {
    $check = $conn->prepare("SELECT id FROM reports WHERE image_hash = ? AND user_id = ? LIMIT 1");
    $check->bind_param("si", $image_hash, $user_id);
    $check->execute();
    $existing = $check->get_result()->fetch_assoc();
    $check->close();

    if ($existing) {
        $report_id = $existing['id'];
        $sql = "UPDATE reports SET lab_name = ?, report_type = ?, report_date = ?, raw_text = ?, ai_summary_en = ?, ai_summary_ne = ?, overall_status = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('sssssssi', $lab_name, $report_type, $report_date, $raw_text, $ai_summary_en, $ai_summary_ne, $overall_status, $report_id);
        $stmt->execute();
        $stmt->close();
        echo json_encode(['status' => 'success', 'id' => $report_id, 'updated' => true]);
        exit;
    }
}

$stmt = $conn->prepare("INSERT INTO reports (user_id, lab_name, report_type, report_date, raw_text, image_path, ai_summary_en, ai_summary_ne, overall_status, image_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param('isssssssss', $user_id, $lab_name, $report_type, $report_date, $raw_text, $image_path, $ai_summary_en, $ai_summary_ne, $overall_status, $image_hash);

if (!$stmt->execute()) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save']);
    exit;
}

$report_id = $conn->insert_id;
$stmt->close();

// Insert tests
foreach ($tests as $t) {
    $name = $t['name'] ?? '';
    $result = $t['result'] ?? null;
    $unit = $t['unit'] ?? null;
    $ref_range = $t['refRange'] ?? $t['range'] ?? null;
    $status = $t['status'] ?? 'normal';
    $ins = $conn->prepare("INSERT INTO report_tests (report_id, test_name, result, unit, ref_range, status) VALUES (?, ?, ?, ?, ?, ?)");
    $ins->bind_param('isssss', $report_id, $name, $result, $unit, $ref_range, $status);
    $ins->execute();
    $ins->close();
}

echo json_encode(['status' => 'success', 'id' => $report_id]);
