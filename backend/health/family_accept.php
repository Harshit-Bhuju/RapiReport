<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';

$token = isset($_GET['token']) ? $_GET['token'] : '';

if (empty($token)) {
    die("Invalid or missing invitation token.");
}

// 1. Find the invitation
$stmt = $conn->prepare("
    SELECT fm.*, u.id as inviter_id, u.username as inviter_name 
    FROM family_members fm 
    JOIN users u ON fm.user_id = u.id 
    WHERE fm.invitation_token = ? AND fm.status = 'pending' 
    LIMIT 1
");
$stmt->bind_param("s", $token);
$stmt->execute();
$invitation = $stmt->get_result()->fetch_assoc();

if (!$invitation) {
    die("Invitation not found or already accepted.");
}

// 2. Check expiration
if (strtotime($invitation['token_expires']) < time()) {
    die("Invitation token has expired.");
}

// 3. Accept invitation
$stmt2 = $conn->prepare("UPDATE family_members SET status = 'accepted', invitation_token = NULL, token_expires = NULL WHERE id = ?");
$stmt2->bind_param("i", $invitation['id']);
if (!$stmt2->execute()) {
    die("Error accepting invitation.");
}

// 4. Auto-login the member
// Fetch target user data
$stmt3 = $conn->prepare("SELECT * FROM users WHERE id = ?");
$stmt3->bind_param("i", $invitation['member_user_id']);
$stmt3->execute();
$user = $stmt3->get_result()->fetch_assoc();

if ($user) {
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['logged_in'] = true;

    // Redirect to dashboard or home
    // Find base URL
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];

    // Redirect to frontend (port 5173 for dev, or same host)
    // For now, let's redirect to origin
    $redirect_url = $protocol . "://" . $host . "/RapiReport";

    // If it's a dev environment with vite, we might need a different port
    // But usually frontend handles root redirect
    header("Location: $redirect_url/family");
    echo "<h1>Success!</h1><p>Invitation accepted. Redirecting you to the dashboard...</p>";
    echo "<script>window.location.href = '/RapiReport/family';</script>";
} else {
    die("Error retrieving user record.");
}
