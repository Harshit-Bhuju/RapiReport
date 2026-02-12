<?php
require_once __DIR__ . '/../../config/session_config.php';
require_once __DIR__ . "/../../config/dbconnect.php";
require_once __DIR__ . "/../../config/header.php";

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized."]);
    exit;
}

// Ensure user is a doctor
$stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
if (!$user || $user['role'] !== 'doctor') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Only doctors can view their transactions."]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch transactions
    // We join appointments to get patient details, and payment_transactions for payment info
    $query = "
        SELECT 
            pt.transaction_uuid,
            pt.transaction_id,
            pt.amount,
            pt.payment_status,
            pt.created_at as transaction_date,
            a.appointment_date,
            a.appointment_time_slot,
            u.username as patient_name,
            u.profile_pic as patient_avatar
        FROM payment_transactions pt
        JOIN appointments a ON pt.appointment_id = a.id
        LEFT JOIN users u ON a.patient_user_id = u.id
        WHERE a.doctor_user_id = ?
        ORDER BY pt.created_at DESC
        LIMIT 50
    ";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $transactions = [];
    $total_earnings = 0;
    $last_30_days_earnings = 0;
    $one_month_ago = date('Y-m-d H:i:s', strtotime('-30 days'));

    while ($row = $result->fetch_assoc()) {
        $transactions[] = $row;
        if ($row['payment_status'] === 'completed') {
            $total_earnings += floatval($row['amount']);
            if ($row['transaction_date'] >= $one_month_ago) {
                $last_30_days_earnings += floatval($row['amount']);
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "transactions" => $transactions,
        "stats" => [
            "total_earnings" => $total_earnings,
            "last_30_days_earnings" => $last_30_days_earnings
        ]
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}

$conn->close();
exit;
