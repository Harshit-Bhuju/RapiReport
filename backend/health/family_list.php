<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
include __DIR__ . '/../config/dbconnect.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get family members I added + members who added me (accepted)
$sql = "
    SELECT fm.id AS link_id, fm.relation, fm.status, fm.created_at,
           u.id AS member_id, u.username, u.email, u.profile_picture
    FROM family_members fm
    JOIN users u ON u.id = fm.member_user_id
    WHERE fm.user_id = ?

    UNION

    SELECT fm.id AS link_id, fm.relation, fm.status, fm.created_at,
           u.id AS member_id, u.username, u.email, u.profile_picture
    FROM family_members fm
    JOIN users u ON u.id = fm.user_id
    WHERE fm.member_user_id = ? AND fm.status = 'accepted'

    ORDER BY created_at DESC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $user_id, $user_id);
$stmt->execute();
$result = $stmt->get_result();

$members = [];
while ($row = $result->fetch_assoc()) {
    $members[] = $row;
}

echo json_encode(['status' => 'success', 'data' => $members]);
?>
