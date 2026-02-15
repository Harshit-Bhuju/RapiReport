<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';

$token = isset($_GET['token']) ? $_GET['token'] : '';
$action = isset($_GET['action']) ? $_GET['action'] : ''; // accept or reject

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
    die("Invitation not found or already processed.");
}

// 2. Check expiration
if (strtotime($invitation['token_expires']) < time()) {
    die("Invitation token has expired.");
}

function showMessage($title, $message, $color = "#4a90e2", $icon = "ℹ️")
{
    header("Content-Type: text/html; charset=UTF-8");
    echo "
    <html>
    <head>
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <title>$title</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f8; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; max-width: 400px; width: 90%; }
            h1 { color: $color; margin-bottom: 20px; font-size: 24px; }
            p { font-size: 16px; color: #555; line-height: 1.5; }
            .icon { font-size: 48px; margin-bottom: 20px; display: block; }
        </style>
    </head>
    <body>
        <div class='card'>
            <span class='icon'>$icon</span>
            <h1>$title</h1>
            <p>$message</p>
        </div>
    </body>
    </html>";
}

if ($action === 'accept') {
    // 3. Accept invitation
    $stmt2 = $conn->prepare("UPDATE family_members SET status = 'accepted', invitation_token = NULL, token_expires = NULL WHERE id = ?");
    $stmt2->bind_param("i", $invitation['id']);

    if ($stmt2->execute()) {
        showMessage("Invitation Accepted! 🎉", "You have successfully joined <strong>" . htmlspecialchars($invitation['inviter_name']) . "</strong>'s family on RapiReport.<br><br>You can now close this tab and log in to your account.", "#28a745", "✅");
    } else {
        showMessage("Error", "Something went wrong while accepting the invitation.", "#dc3545", "❌");
    }
} elseif ($action === 'reject') {
    // 4. Reject and Delete
    $stmt3 = $conn->prepare("DELETE FROM family_members WHERE id = ?");
    $stmt3->bind_param("i", $invitation['id']);

    if ($stmt3->execute()) {
        showMessage("Invitation Declined", "You have declined the invitation from <strong>" . htmlspecialchars($invitation['inviter_name']) . "</strong>.", "#777", "❌");
    } else {
        showMessage("Error", "Something went wrong.", "#dc3545", "❌");
    }
} else {
    // No action specified or invalid action
    showMessage("Invalid Request", "Please use the 'Accept' or 'Reject' links provided in your email.", "#dc3545", "ℹ️");
}
