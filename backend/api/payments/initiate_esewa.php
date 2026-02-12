<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . "/../../config/dbconnect.php";
require_once __DIR__ . "/../../config/header.php";

// Standard way to get base URL for callbacks
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $_SERVER['SERVER_PORT'] == 443 ? "https://" : "http://";
$domainName = $_SERVER['HTTP_HOST'];
$base_url = $protocol . $domainName . "/RapiReport"; // Adjust "RapiReport" if it's in a different folder

// eSewa requires a composer package: xentixar/esewa-sdk
// User should run: composer require xentixar/esewa-sdk
// We'll try to include it but provide a fallback if not found
$sdk_path = __DIR__ . '/../../vendor/autoload.php';
if (file_exists($sdk_path)) {
    require_once $sdk_path;
}

use Xentixar\EsewaSdk\Esewa;

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input) {
        $_POST = $input;
    }

    $doctor_user_id = intval($_POST['doctor_user_id'] ?? 0);
    $appointment_date = trim($_POST['appointment_date'] ?? '');
    $appointment_time_slot = trim($_POST['appointment_time_slot'] ?? '');
    $consultation_fee = floatval($_POST['consultation_fee'] ?? 0);
    $notes = trim($_POST['notes'] ?? '');

    if (!$doctor_user_id || !$appointment_date || !$appointment_time_slot) {
        echo json_encode(["status" => "error", "message" => "Missing booking details."]);
        exit;
    }

    $transaction_uuid = uniqid('RR-', true);

    $conn->begin_transaction();

    try {
        // 1. Create Appointment (Status: Pending)
        $stmt = $conn->prepare("INSERT INTO appointments (patient_user_id, doctor_user_id, appointment_date, appointment_time_slot, status, consultation_fee, notes) VALUES (?, ?, ?, ?, 'pending', ?, ?)");
        $stmt->bind_param("iissds", $user_id, $doctor_user_id, $appointment_date, $appointment_time_slot, $consultation_fee, $notes);
        $stmt->execute();
        $appointment_id = $conn->insert_id;
        $stmt->close();

        // 2. Create Payment Transaction (Status: Pending)
        $stmt = $conn->prepare("INSERT INTO payment_transactions (appointment_id, amount, payment_method, payment_status, transaction_uuid) VALUES (?, ?, 'esewa', 'pending', ?)");
        $stmt->bind_param("ids", $appointment_id, $consultation_fee, $transaction_uuid);
        $stmt->execute();
        $stmt->close();

        $conn->commit();

        // 3. Prepare eSewa Redirect
        // Test Credentials (as per plan)
        $merchant_id = "EPAYTEST";
        $secret_key = "8gBm/:&EnhH.1/q";

        // Determine frontend URL for redirection after callback
        $frontend_url = "http://localhost:5173";
        if (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'harmanbhuju.com.np') !== false) {
            $frontend_url = "https://harmanbhuju.com.np";
        } elseif (isset($_SERVER['HTTP_REFERER'])) {
            // Try to use referrer as frontend URL if available
            $parsed = parse_url($_SERVER['HTTP_REFERER']);
            if ($parsed && isset($parsed['scheme']) && isset($parsed['host'])) {
                $port = isset($parsed['port']) ? ":" . $parsed['port'] : "";
                $frontend_url = $parsed['scheme'] . "://" . $parsed['host'] . $port;
            }
        }

        // Store in session for retrieval in callback
        $_SESSION['frontend_url'] = $frontend_url;

        // Callback URLs without query params (cleaner and safer for some gateways)
        $success_url = $base_url . "/backend/api/payments/payment_success.php";
        $failure_url = $base_url . "/backend/api/payments/payment_failure.php";

        if (class_exists('Xentixar\EsewaSdk\Esewa')) {
            $esewa = new Esewa();
            $esewa->config(
                $success_url,
                $failure_url,
                $consultation_fee,
                $transaction_uuid,
                $merchant_id,
                $secret_key,
                0, // service charge
                0, // delivery charge
                0  // tax amount
            );

            // Instead of executing it (which echoes a form), we might want to return the HTML or parts of it
            // The CultureConnect pattern often uses the SDK's init() method which echoes the form.
            // Since this is an AJAX call, we'll return the HTML form to the frontend to submit.

            ob_start();
            $esewa->init(); // This echoes a self-submitting HTML form
            $form_html = ob_get_clean();

            echo json_encode([
                "status" => "success",
                "html" => $form_html,
                "appointment_id" => $appointment_id
            ]);
        } else {
            echo json_encode(["status" => "error", "message" => "eSewa SDK not found. Please run composer require xentixar/esewa-sdk."]);
        }
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
