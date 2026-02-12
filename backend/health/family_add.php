<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';
require_once __DIR__ . '/../config/mail.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get inviter name
$stmt0 = $conn->prepare("SELECT username FROM users WHERE id = ?");
$stmt0->bind_param("i", $user_id);
$stmt0->execute();
$inviter = $stmt0->get_result()->fetch_assoc();
$inviterName = $inviter['username'] ?? 'Family Member';

$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true) ?: [];

$email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
$relation = isset($data['relation']) ? trim($data['relation']) : '';

if (empty($email)) {
    echo json_encode(['status' => 'error', 'message' => 'Email is required']);
    exit;
}

// 1. Check if user already exists
$stmt = $conn->prepare("SELECT id, username, email, profile_pic FROM users WHERE email = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$target = $result->fetch_assoc();

if ($target && (int)$target['id'] === (int)$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'You cannot add yourself']);
    exit;
}

$target_user_id = null;
if ($target) {
    $target_user_id = $target['id'];
} else {
    // Create a "pending" user if they don't exist
    // Using a placeholder google_id since it's NOT NULL
    $placeholder_google_id = "pending_" . bin2hex(random_bytes(8));
    $placeholder_username = explode('@', $email)[0];

    $stmt_new = $conn->prepare("INSERT INTO users (google_id, email, username, profile_complete) VALUES (?, ?, ?, 0)");
    $stmt_new->bind_param("sss", $placeholder_google_id, $email, $placeholder_username);
    if ($stmt_new->execute()) {
        $target_user_id = $stmt_new->insert_id;
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to create guest user']);
        exit;
    }
}

// 2. Check if already linked
$stmt2 = $conn->prepare("SELECT id FROM family_members WHERE user_id = ? AND member_user_id = ?");
$stmt2->bind_param("ii", $user_id, $target_user_id);
$stmt2->execute();
if ($stmt2->get_result()->num_rows > 0) {
    echo json_encode(['status' => 'error', 'message' => 'This member is already in your family or invited']);
    exit;
}

// 3. Generate invitation token (Magic Link)
$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+7 days'));

// 4. Insert the link with pending status
$stmt3 = $conn->prepare("INSERT INTO family_members (user_id, member_user_id, relation, status, invitation_token, token_expires) VALUES (?, ?, ?, 'pending', ?, ?)");
$stmt3->bind_param("iisss", $user_id, $target_user_id, $relation, $token, $expires);
$stmt3->execute();

$invite_id = $stmt3->insert_id;

// 5. Send invitation email
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
// Detect if we are on a tunnel by checking headers if needed, but HTTP_HOST usually works
$magicLink = "$protocol://$host/RapiReport/backend/health/family_accept.php?token=$token";

// Send response immediately and then send email in the background
sendResponseAndContinue([
    'status' => 'success',
    'message' => 'Invitation sent to ' . $email,
    'invitation' => [
        'id' => $invite_id,
        'email' => $email,
        'status' => 'pending'
    ]
]);

sendFamilyInvitationEmail($email, $inviterName, $relation, $magicLink);
