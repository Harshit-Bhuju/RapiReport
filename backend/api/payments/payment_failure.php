<?php
require_once __DIR__ . '/../../config/dbconnect.php';

// eSewa Failure Callback
// Just redirects back to frontend with failure message

$frontend_url = $_GET['frontend_url'] ?? "http://localhost:5173";

// Fallback if not provided
if (!isset($_GET['frontend_url']) && isset($_SERVER['HTTP_HOST'])) {
    if (strpos($_SERVER['HTTP_HOST'], 'harmanbhuju.com.np') !== false) {
        $frontend_url = "https://harmanbhuju.com.np";
    } elseif (strpos($_SERVER['HTTP_HOST'], 'harshitbhuju.com.np') !== false) {
        $frontend_url = "https://harshitbhuju.com.np";
    }
}

header("Location: " . $frontend_url . "/booking-failed?error=Payment Cancelled or Failed");
exit;
