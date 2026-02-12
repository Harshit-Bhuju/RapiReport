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

// Check if reports table exists
$tableCheck = $conn->query("SHOW TABLES LIKE 'reports'");
if (!$tableCheck || $tableCheck->num_rows === 0) {
    echo json_encode(['status' => 'success', 'data' => []]);
    exit;
}

$stmt = $conn->prepare("SELECT id, user_id, lab_name, report_type, report_date, raw_text, image_path, ai_summary_en, ai_summary_ne, overall_status, created_at FROM reports WHERE user_id = ? ORDER BY created_at DESC");
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();
$list = [];
while ($row = $result->fetch_assoc()) {
    $id = (int) $row['id'];
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
    $list[] = [
        'id' => (string) $id,
        'user_id' => (int) $row['user_id'],
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
    ];
}
$stmt->close();
$conn->close();
echo json_encode(['status' => 'success', 'data' => $list]);
