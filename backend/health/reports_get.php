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

$id = (int) ($_GET['id'] ?? 0);
if (!$id) {
    echo json_encode(['status' => 'error', 'message' => 'Report ID required']);
    exit;
}

$tableCheck = $conn->query("SHOW TABLES LIKE 'reports'");
if (!$tableCheck || $tableCheck->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Report not found']);
    exit;
}

$stmt = $conn->prepare("SELECT id, user_id, lab_name, report_type, report_date, raw_text, image_path, ai_summary_en, ai_summary_ne, overall_status, created_at FROM reports WHERE id = ? AND user_id = ?");
$stmt->bind_param('ii', $id, $user_id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stmt->close();

if (!$row) {
    echo json_encode(['status' => 'error', 'message' => 'Report not found']);
    exit;
}

$testsStmt = $conn->prepare("SELECT test_name, result, unit, ref_range, status FROM report_tests WHERE report_id = ?");
$testsStmt->bind_param('i', $id);
$testsStmt->execute();
$testsResult = $testsStmt->get_result();
$tests = [];
while ($t = $testsResult->fetch_assoc()) {
    $tests[] = [
        'name' => $t['test_name'],
        'result' => $t['result'],
        'unit' => $t['unit'],
        'range' => $t['ref_range'],
        'status' => $t['status'],
    ];
}
$testsStmt->close();
$conn->close();

echo json_encode([
    'status' => 'success',
    'data' => [
        'id' => (string) $row['id'],
        'lab' => $row['lab_name'],
        'type' => $row['report_type'],
        'date' => $row['report_date'],
        'rawText' => $row['raw_text'],
        'imagePath' => $row['image_path'],
        'aiSummaryEn' => $row['ai_summary_en'],
        'aiSummaryNe' => $row['ai_summary_ne'],
        'status' => $row['overall_status'],
        'createdAt' => $row['created_at'],
        'tests' => $tests,
    ],
]);
