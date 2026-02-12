<?php
// Mocking session and database for verification
require_once __DIR__ . '/../config/dbconnect.php';

echo "--- Starting Verification ---\n";

// 1. Clean up old test data if any
$conn->query("DELETE FROM users WHERE email = 'test_family@example.com'");
$conn->query("DELETE FROM family_members WHERE user_id = 1 AND member_user_id IN (SELECT id FROM users WHERE email = 'test_family@example.com')");

echo "1. Testing family_add.php logic (Manual simulation)\n";
// We'll simulate the logic since we can't easily perform a web request here
$user_id = 1; // Assuming ID 1 exists as inviter
$email = 'test_family@example.com';
$relation = 'Brother';

// Run logic
$placeholder_google_id = "pending_test_" . bin2hex(random_bytes(4));
$placeholder_username = "test_family";
$stmt_new = $conn->prepare("INSERT INTO users (google_id, email, username, profile_complete) VALUES (?, ?, ?, 0)");
$stmt_new->bind_param("sss", $placeholder_google_id, $email, $placeholder_username);
$stmt_new->execute();
$target_user_id = $stmt_new->insert_id;
echo "Created test user: ID $target_user_id\n";

$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+7 days'));
$stmt3 = $conn->prepare("INSERT INTO family_members (user_id, member_user_id, relation, status, invitation_token, token_expires) VALUES (?, ?, ?, 'pending', ?, ?)");
$stmt3->bind_param("iisss", $user_id, $target_user_id, $relation, $token, $expires);
$stmt3->execute();
$invite_id = $stmt3->insert_id;
echo "Created invitation: ID $invite_id with token $token\n";

echo "2. Testing family_accept.php logic (Manual simulation)\n";
$stmt_v = $conn->prepare("SELECT fm.* FROM family_members fm WHERE fm.invitation_token = ? AND fm.status = 'pending' LIMIT 1");
$stmt_v->bind_param("s", $token);
$stmt_v->execute();
$invitation = $stmt_v->get_result()->fetch_assoc();

if ($invitation) {
    echo "Found invitation for token. Accepting...\n";
    $stmt_a = $conn->prepare("UPDATE family_members SET status = 'accepted', invitation_token = NULL, token_expires = NULL WHERE id = ?");
    $stmt_a->bind_param("i", $invitation['id']);
    $stmt_a->execute();
    echo "Invitation status updated to accepted.\n";
} else {
    echo "Error: Invitation not found!\n";
}

// Final check
$res = $conn->query("SELECT status FROM family_members WHERE id = $invite_id");
$final_status = $res->fetch_assoc()['status'];
echo "Final status in DB: $final_status\n";

if ($final_status === 'accepted') {
    echo "Verification SUCCESS!\n";
} else {
    echo "Verification FAILED!\n";
}

// Cleanup
$conn->query("DELETE FROM users WHERE id = $target_user_id");
$conn->query("DELETE FROM family_members WHERE id = $invite_id");
echo "--- Verification Finished ---\n";
