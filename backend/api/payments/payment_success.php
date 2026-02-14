<?php
require_once __DIR__ . '/../../config/dbconnect.php';

// Debug Logging - Log EVERYTHING
file_put_contents(__DIR__ . '/esewa_debug.log', "=== NEW SUCCESS CALLBACK ===\n", FILE_APPEND);
file_put_contents(__DIR__ . '/esewa_debug.log', "GET: " . print_r($_GET, true) . "\n", FILE_APPEND);
file_put_contents(__DIR__ . '/esewa_debug.log', "POST: " . print_r($_POST, true) . "\n", FILE_APPEND);
file_put_contents(__DIR__ . '/esewa_debug.log', "REQUEST: " . print_r($_REQUEST, true) . "\n", FILE_APPEND);

// eSewa Success Callback
$data = $_GET['data'] ?? ($_POST['data'] ?? null);

// If using SDK's decode, it might check other places. 
// But manual decoding needs the string.

$frontend_url = $_SESSION['frontend_url'] ?? "http://localhost:5173";
// Fallback
if ($frontend_url === "http://localhost:5173" && isset($_SERVER['HTTP_HOST'])) {
    if (strpos($_SERVER['HTTP_HOST'], 'harmanbhuju.com.np') !== false) {
        $frontend_url = "https://harmanbhuju.com.np";
    } elseif (strpos($_SERVER['HTTP_HOST'], 'harshitbhuju.com.np') !== false) {
        $frontend_url = "https://harshitbhuju.com.np";
    }
}

if (empty($data)) {
    file_put_contents(__DIR__ . '/esewa_debug.log', "ERROR: No data received.\n", FILE_APPEND);
    // Try to be helpful - if we have a q or other param?
    die("Error: No data received from eSewa. Debug info written to log.");
}

// Decode eSewa data
$json_data = base64_decode($data);
$response = json_decode($json_data, true);

if (!$response) {
    die("Error: Invalid response from eSewa.");
}

/* Response structure:
{
    "status": "COMPLETE",
    "signature": "...",
    "transaction_uuid": "...",
    "transaction_code": "...",
    "total_amount": "...",
    ...
}
*/

// Debug Logging
file_put_contents(__DIR__ . '/esewa_debug.log', "Received Data: " . $data . "\n", FILE_APPEND);
file_put_contents(__DIR__ . '/esewa_debug.log', "Decoded JSON: " . $json_data . "\n", FILE_APPEND);

$status = $response['status'] ?? '';
$signature = $response['signature'] ?? '';
$transaction_uuid = $response['transaction_uuid'] ?? '';
$transaction_code = $response['transaction_code'] ?? ''; // This is eSewa's ID
$total_amount = $response['total_amount'] ?? '';

// 1. Verify Signature
$secret_key = "8gBm/:&EnhH.1/q";

// Construct message based on signed_field_names if available
$signed_field_names = $response['signed_field_names'] ?? '';
if (!empty($signed_field_names)) {
    $fields = explode(',', $signed_field_names);
    $message_array = [];
    foreach ($fields as $field) {
        $message_array[] = $field . "=" . ($response[$field] ?? '');
    }
    $message = implode(',', $message_array);
} else {
    // Fallback to standard if not present (though it seems it IS present)
    $message = "total_amount=" . $total_amount . ",transaction_uuid=" . $transaction_uuid . ",product_code=EPAYTEST";
}

$s = hash_hmac('sha256', $message, $secret_key, true);
$expected_signature = base64_encode($s);

file_put_contents(__DIR__ . '/esewa_debug.log', "Status: $status\n", FILE_APPEND);
file_put_contents(__DIR__ . '/esewa_debug.log', "Message: $message\n", FILE_APPEND);
file_put_contents(__DIR__ . '/esewa_debug.log', "Calculated Sig: $expected_signature\n", FILE_APPEND);
file_put_contents(__DIR__ . '/esewa_debug.log', "Received Sig: $signature\n", FILE_APPEND);
file_put_contents(__DIR__ . '/esewa_debug.log', "--------------------------------\n", FILE_APPEND);

if ($status === 'COMPLETE' && $signature === $expected_signature) {
    // 2. Update Database
    $conn->begin_transaction();
    try {
        // Update payment_transaction
        $stmt = $conn->prepare("UPDATE payment_transactions SET payment_status = 'completed', transaction_id = ?, payment_date = CURRENT_TIMESTAMP WHERE transaction_uuid = ?");
        $stmt->bind_param("ss", $transaction_code, $transaction_uuid);
        $stmt->execute();
        $stmt->close();

        // Get appointment_id
        $stmt = $conn->prepare("SELECT appointment_id FROM payment_transactions WHERE transaction_uuid = ?");
        $stmt->bind_param("s", $transaction_uuid);
        $stmt->execute();
        $appointment_id = $stmt->get_result()->fetch_assoc()['appointment_id'] ?? 0;
        $stmt->close();

        if ($appointment_id) {
            // Update appointment status
            $stmt = $conn->prepare("UPDATE appointments SET status = 'confirmed' WHERE id = ?");
            $stmt->bind_param("i", $appointment_id);
            $stmt->execute();
            $stmt->close();

            // Create initial consultation call record
            $room_id = "ROOM-" . uniqid();
            $stmt = $conn->prepare("INSERT INTO consultation_calls (appointment_id, room_id, status) VALUES (?, ?, 'scheduled')");
            $stmt->bind_param("is", $appointment_id, $room_id);
            $stmt->execute();
            $stmt->close();
        }

        $conn->commit();

        header("Location: " . $frontend_url . "/booking-success?appointment_id=" . $appointment_id);
        exit;
    } catch (Exception $e) {
        $conn->rollback();
        file_put_contents(__DIR__ . '/esewa_debug.log', "DB Error: " . $e->getMessage() . "\n", FILE_APPEND);
        die("Database Error: " . $e->getMessage());
    }
} else {
    // Invalid signature or payment failed
    $error_msg = "Signature Verification Failed. Status: $status. RecSig: $signature. ExpSig: $expected_signature";
    file_put_contents(__DIR__ . '/esewa_debug.log', "Error: $error_msg\n", FILE_APPEND);

    header("Location: " . $frontend_url . "/booking-failed?error=" . urlencode($error_msg));
    exit;
}
