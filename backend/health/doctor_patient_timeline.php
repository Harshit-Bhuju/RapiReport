<?php
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';
include __DIR__ . '/../config/header.php';

$user_id = $_SESSION['user_id'] ?? null;
$patient_id = (int) ($_GET['patient_id'] ?? 0);
if (!$user_id || !$patient_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$role = $_SESSION['role'] ?? null;
if (!$role) {
    $r = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $r->bind_param('i', $user_id);
    $r->execute();
    $rr = $r->get_result();
    if ($rr && $rr->num_rows) {
        $role = $rr->fetch_assoc()['role'];
    }
    $r->close();
}

if ($role !== 'doctor') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Doctor access required']);
    exit;
}

$timeline = [];

$rx = $conn->prepare("SELECT id, note, raw_text, created_at FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10");
$rx->bind_param('i', $patient_id);
$rx->execute();
$rxr = $rx->get_result();
while ($r = $rxr->fetch_assoc()) {
    $medsStmt = $conn->prepare("SELECT name FROM prescription_medicines WHERE prescription_id = ?");
    $medsStmt->bind_param('i', $r['id']);
    $medsStmt->execute();
    $medsRes = $medsStmt->get_result();
    $meds = [];
    while ($m = $medsRes->fetch_assoc()) {
        $meds[] = $m['name'];
    }
    $medsStmt->close();
    $timeline[] = [
        'type' => 'rx',
        'at' => $r['created_at'],
        'title' => count($meds) . ' medicines',
        'detail' => $r['note'] ?: 'Prescription',
        'meds' => $meds,
    ];
}
$rx->close();

$sx = $conn->prepare("SELECT log_date, text, severity FROM symptoms WHERE user_id = ? ORDER BY log_date DESC, created_at DESC LIMIT 10");
$sx->bind_param('i', $patient_id);
$sx->execute();
$sxr = $sx->get_result();
while ($s = $sxr->fetch_assoc()) {
    $timeline[] = [
        'type' => 'symptom',
        'at' => $s['log_date'],
        'title' => $s['text'],
        'severity' => $s['severity'],
    ];
}
$sx->close();

$adh = $conn->prepare("SELECT log_date, medicine_name, slot, taken FROM adherence_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 20");
$adh->bind_param('i', $patient_id);
$adh->execute();
$adhr = $adh->get_result();
$missedCount = 0;
$last7Days = date('Y-m-d', strtotime('-7 days'));
while ($a = $adhr->fetch_assoc()) {
    if ($a['log_date'] >= $last7Days && !$a['taken']) {
        $missedCount++;
    }
}
$adh->close();

usort($timeline, function($a, $b) {
    return strtotime($b['at']) - strtotime($a['at']);
});

$conn->close();

echo json_encode(['status' => 'success', 'timeline' => array_slice($timeline, 0, 15), 'missedDosesLast7Days' => $missedCount]);
