<?php
require_once __DIR__ . '/../../config/header.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

// Poll for any consultation call in 'ringing' status where:
// 1. Current user is the patient and there's an appointment with this doctor
// 2. Current user is the doctor and there's an appointment with this patient
// Actually, we just need to check if consultation_calls has a ringing status
// and the associated appointment involves the current user.

$sql = "
SELECT
cc.id as call_id,
cc.room_id,
cc.status as call_status,
a.id as appointment_id,
a.doctor_user_id,
a.patient_user_id,
COALESCE(dp.display_name, u_doc.username) as doctor_name,
u_doc.profile_pic as doctor_avatar,
u_pat.username as patient_name,
u_pat.profile_pic as patient_avatar
FROM consultation_calls cc
JOIN appointments a ON cc.appointment_id = a.id
JOIN users u_doc ON a.doctor_user_id = u_doc.id
LEFT JOIN doctor_profiles dp ON u_doc.id = dp.user_id
JOIN users u_pat ON a.patient_user_id = u_pat.id
WHERE cc.status = 'ringing'
AND (a.doctor_user_id = ? OR a.patient_user_id = ?)
AND (cc.caller_user_id != ?)
LIMIT 1
";

$stmt = $conn->prepare($sql);
$stmt->bind_param('iii', $user_id, $user_id, $user_id);
$stmt->execute();
$res = $stmt->get_result();

$calls = [];
while ($row = $res->fetch_assoc()) {
    // Determine if the current user is being called (callee)
    // For doctor starting call: patient is callee.
    // In this MVP, we'll assume whoever DIDN'T start the ringing is the callee.
    // However, consultation_calls doesn't store 'caller'.
    // We'll trust the frontend logic or add a caller_id if needed.
    // For now, let's just return the ringing call if it involves the user.
    $calls[] = $row;
}

echo json_encode(['status' => 'success', 'calls' => $calls]);
$conn->close();
