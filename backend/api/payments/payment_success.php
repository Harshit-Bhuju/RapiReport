<?php
require_once __DIR__ . '/../../config/dbconnect.php';

// eSewa Success Callback
// It receives a base64 encoded JSON string in 'data' parameter (for v2)
$data = $_GET['data'] ?? '';

if (empty($data)) {
    die("Error: No data received from eSewa.");
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

$status = $response['status'] ?? '';
$signature = $response['signature'] ?? '';
$transaction_uuid = $response['transaction_uuid'] ?? '';
$transaction_code = $response['transaction_code'] ?? ''; // This is eSewa's ID
$total_amount = $response['total_amount'] ?? '';

// 1. Verify Signature
$secret_key = "8gBm/:&EnhH.1/q";
$message = "total_amount=" . $total_amount . ",transaction_uuid=" . $transaction_uuid . ",product_code=EPAYTEST";
$s = hash_hmac('sha256', $message, $secret_key, true);
$expected_signature = base64_encode($s);

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

        // Redirect to Frontend Success Page
        // Assuming frontend is at http://localhost:5173
        // In local development, we often use the host or a config
        header("Location: http://localhost:5173/booking-success?appointment_id=" . $appointment_id);
        exit;
    } catch (Exception $e) {
        $conn->rollback();
        die("Database Error: " . $e->getMessage());
    }
} else {
    // Invalid signature or payment failed
    header("Location: http://localhost:5173/booking-failed?error=Signature Verification Failed");
    exit;
}
