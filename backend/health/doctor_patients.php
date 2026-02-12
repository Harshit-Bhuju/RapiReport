<?php
require_once __DIR__ . "/../../config/header.php";

$user_id = $_SESSION['user_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

// Verify user is a doctor
$stmt = $conn->prepare("SELECT role FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();
if (!$res || $res['role'] !== 'doctor') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied"]);
    exit;
}

// Fetch patients who have booked appointments with this doctor
// We join appointments with users to get patient details
$query = "SELECT DISTINCT u.id, u.username as name, u.email, 
                 TIMESTAMPDIFF(YEAR, u.created_at, CURDATE()) + 20 as age, -- Mock logic for age if DOB not in DB
                 'Unknown' as gender,
                 '[]' as chronic, 
                 '[]' as allergies
          FROM appointments a
          JOIN users u ON a.user_id = u.id
          WHERE a.doctor_id = ?
          ORDER BY a.appointment_date DESC";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$patients = [];
while ($row = $result->fetch_assoc()) {
    // Decode JSON fields if they exist in future schema, for now using placeholders
    $row['chronic'] = json_decode($row['chronic']);
    $row['allergies'] = json_decode($row['allergies']);
    $patients[] = $row;
}

echo json_encode(["status" => "success", "data" => $patients]); // Structure matches frontend expectation
$conn->close();
