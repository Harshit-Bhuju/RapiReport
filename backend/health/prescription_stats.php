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

$stats = [];

$totalRx = $conn->prepare("SELECT COUNT(DISTINCT p.id) as cnt FROM prescriptions p JOIN consultations c ON c.patient_user_id = p.user_id WHERE c.doctor_user_id = ?");
$totalRx->bind_param('i', $user_id);
$totalRx->execute();
$totalRxRes = $totalRx->get_result();
if ($totalRxRes && $totalRxRes->num_rows) {
    $stats['totalPrescriptions'] = (int) $totalRxRes->fetch_assoc()['cnt'];
}
$totalRx->close();

$commonMeds = $conn->prepare("
    SELECT pm.name, COUNT(*) as cnt
    FROM prescription_medicines pm
    JOIN prescriptions p ON p.id = pm.prescription_id
    JOIN consultations c ON c.patient_user_id = p.user_id
    WHERE c.doctor_user_id = ?
    GROUP BY pm.name
    ORDER BY cnt DESC
    LIMIT 5
");
$commonMeds->bind_param('i', $user_id);
$commonMeds->execute();
$commonMedsRes = $commonMeds->get_result();
$stats['commonMedicines'] = [];
if ($commonMedsRes) {
    while ($m = $commonMedsRes->fetch_assoc()) {
        $stats['commonMedicines'][] = ['name' => $m['name'], 'count' => (int) $m['cnt']];
    }
}
$commonMeds->close();

$recentRx = $conn->prepare("
    SELECT COUNT(*) as cnt
    FROM prescriptions p
    JOIN consultations c ON c.patient_user_id = p.user_id
    WHERE c.doctor_user_id = ?
    AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
");
$recentRx->bind_param('i', $user_id);
$recentRx->execute();
$recentRxRes = $recentRx->get_result();
if ($recentRxRes && $recentRxRes->num_rows) {
    $stats['prescriptionsLast30Days'] = (int) $recentRxRes->fetch_assoc()['cnt'];
}
$recentRx->close();

$conn->close();

echo json_encode(['status' => 'success', 'data' => $stats]);
