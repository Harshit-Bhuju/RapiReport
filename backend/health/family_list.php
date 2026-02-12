<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include __DIR__ . '/../config/dbconnect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

// Get family members I added + members who added me (accepted)
// Note: we don't rely on inverse_relation here so it works with older schemas too.
$sql = "
    SELECT 
        fm.id AS link_id, 
        fm.relation AS relation, 
        fm.status, 
        fm.created_at,
        u.id AS member_id, 
        u.username, 
        u.email, 
        u.profile_pic AS profile_picture,
        CASE 
            WHEN u.last_login >= (NOW() - INTERVAL 5 MINUTE) THEN 1 
            ELSE 0 
        END AS is_online
    FROM family_members fm
    JOIN users u ON u.id = fm.member_user_id
    WHERE fm.user_id = ?

    UNION

    SELECT 
        fm.id AS link_id, 
        fm.relation AS relation, 
        fm.status, 
        fm.created_at,
        u.id AS member_id, 
        u.username, 
        u.email, 
        u.profile_pic AS profile_picture,
        CASE 
            WHEN u.last_login >= (NOW() - INTERVAL 5 MINUTE) THEN 1 
            ELSE 0 
        END AS is_online
    FROM family_members fm
    JOIN users u ON u.id = fm.user_id
    WHERE fm.member_user_id = ? AND fm.status = 'accepted'

    ORDER BY created_at DESC
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to load family members',
        'error' => $conn->error,
    ]);
    exit;
}

$stmt->bind_param("ii", $user_id, $user_id);

if (!$stmt->execute()) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to load family members',
        'error' => $stmt->error,
    ]);
    exit;
}

$result = $stmt->get_result();

$members = [];
while ($row = $result->fetch_assoc()) {
    $members[] = $row;
}

echo json_encode([
    'status' => 'success',
    'data' => $members,
    'current_user_id' => $user_id,
]);
