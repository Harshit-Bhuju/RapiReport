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

// Check if reports table exists
$tableCheck = $conn->query("SHOW TABLES LIKE 'reports'");
if (!$tableCheck || $tableCheck->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Reports table not found. Import backend/rapireport.sql']);
    exit;
}

$lab_name = '';
$report_type = '';
$report_date = null;
$raw_text = '';
$image_path = null;
$ai_summary_en = '';
$ai_summary_ne = '';
$overall_status = 'normal';
$tests = [];

if (isset($_POST['labName']) || isset($_POST['rawText'])) {
    $lab_name = trim($_POST['labName'] ?? '');
    $report_type = trim($_POST['reportType'] ?? 'Lab Report');
    $report_date = !empty($_POST['reportDate']) ? $_POST['reportDate'] : null;
    $raw_text = trim($_POST['rawText'] ?? '');
    $ai_summary_en = trim($_POST['aiSummaryEn'] ?? '');
    $ai_summary_ne = trim($_POST['aiSummaryNe'] ?? '');
    $overall_status = trim($_POST['overallStatus'] ?? 'normal');
    $tests = isset($_POST['tests']) ? json_decode($_POST['tests'], true) : [];

    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = __DIR__ . '/../uploads/reports/';
        if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);

        $allowed = ['image/jpeg', 'image/jpg', 'image/png'];
        if (in_array($_FILES['image']['type'], $allowed) && $_FILES['image']['size'] <= 5 * 1024 * 1024) {
            $ext = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $filename = uniqid('rpt_', true) . '.' . $ext;
            if (move_uploaded_file($_FILES['image']['tmp_name'], $upload_dir . $filename)) {
                $image_path = 'backend/uploads/reports/' . $filename;
            }
        }
    }
} else {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $lab_name = trim($input['labName'] ?? '');
    $report_type = trim($input['reportType'] ?? 'Lab Report');
    $report_date = $input['reportDate'] ?? null;
    $raw_text = trim($input['rawText'] ?? '');
    $ai_summary_en = trim($input['aiSummaryEn'] ?? '');
    $ai_summary_ne = trim($input['aiSummaryNe'] ?? '');
    $overall_status = trim($input['overallStatus'] ?? 'normal');
    $tests = $input['tests'] ?? [];
}

$report_date_sql = $report_date ?: null;

$stmt = $conn->prepare("INSERT INTO reports (user_id, lab_name, report_type, report_date, raw_text, image_path, ai_summary_en, ai_summary_ne, overall_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param('issssssss', $user_id, $lab_name, $report_type, $report_date_sql, $raw_text, $image_path, $ai_summary_en, $ai_summary_ne, $overall_status);

if (!$stmt->execute()) {
    $stmt->close();
    $conn->close();
    echo json_encode(['status' => 'error', 'message' => 'Failed to save report']);
    exit;
}

$report_id = (int) $conn->insert_id;
$stmt->close();

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

$conn->close();
echo json_encode(['status' => 'success', 'id' => $report_id, 'imagePath' => $image_path]);
