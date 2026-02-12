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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
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

$list = [];
if ($role === 'doctor') {
    $stmt = $conn->prepare("
        SELECT r.id, r.patient_user_id, r.symptoms_text, r.vitals_json, r.diet_activity_note, r.status, r.created_at,
               u.username AS patient_name, u.email AS patient_email
        FROM async_consultation_requests r
        JOIN users u ON u.id = r.patient_user_id
        WHERE r.status = 'pending'
        ORDER BY r.created_at DESC
    ");
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $list[] = [
            'id' => (int) $row['id'],
            'patientUserId' => (int) $row['patient_user_id'],
            'patientName' => $row['patient_name'],
            'patientEmail' => $row['patient_email'],
            'symptomsText' => $row['symptoms_text'],
            'vitals' => $row['vitals_json'] ? json_decode($row['vitals_json'], true) : null,
            'dietActivityNote' => $row['diet_activity_note'],
            'status' => $row['status'],
            'createdAt' => $row['created_at'],
        ];
    }
    $stmt->close();
} else {
    $stmt = $conn->prepare("SELECT id, symptoms_text, vitals_json, diet_activity_note, status, created_at, doctor_notes, reviewed_at FROM async_consultation_requests WHERE patient_user_id = ? ORDER BY created_at DESC");
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $list[] = [
            'id' => (int) $row['id'],
            'symptomsText' => $row['symptoms_text'],
            'vitals' => $row['vitals_json'] ? json_decode($row['vitals_json'], true) : null,
            'dietActivityNote' => $row['diet_activity_note'],
            'status' => $row['status'],
            'createdAt' => $row['created_at'],
            'doctorNotes' => $row['doctor_notes'],
            'reviewedAt' => $row['reviewed_at'],
        ];
    }
    $stmt->close();
}
$conn->close();

echo json_encode(['status' => 'success', 'data' => $list]);
