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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$patients = [];
$stmt = $conn->prepare("
    SELECT DISTINCT u.id, u.username, u.email, u.age, u.gender, u.conditions, u.parental_history,
           MAX(c.created_at) as last_consultation
    FROM consultations c
    JOIN users u ON u.id = c.patient_user_id
    WHERE c.doctor_user_id = ?
    GROUP BY u.id, u.username, u.email, u.age, u.gender, u.conditions, u.parental_history
    ORDER BY last_consultation DESC
");
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $conditions = [];
    if ($row['conditions']) {
        $c = json_decode($row['conditions'], true);
        $conditions = is_array($c) ? $c : [$row['conditions']];
    }
    $patients[] = [
        'id' => (string) $row['id'],
        'name' => $row['username'],
        'email' => $row['email'],
        'age' => (int) $row['age'],
        'gender' => $row['gender'],
        'chronic' => $conditions,
        'allergies' => [],
        'lastConsultation' => $row['last_consultation'],
    ];
}
$stmt->close();
$conn->close();

echo json_encode(['status' => 'success', 'data' => $patients]);
