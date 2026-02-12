<?php
require_once __DIR__ . '/../../config/dbconnect.php';

// eSewa Failure Callback
// Just redirects back to frontend with failure message
header("Location: http://localhost:5173/booking-failed?error=Payment Cancelled or Failed");
exit;
