<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config/dbconnect.php';

$user_id = isset($_GET['user_id']) ? $conn->real_escape_string($_GET['user_id']) : 1;
$today = date("Y-m-d");

$sql = "SELECT quest_id FROM quest_logs WHERE user_id = '$user_id' AND DATE(completed_at) = '$today'";
$result = $conn->query($sql);

$completed_ids = [];
while ($row = $result->fetch_assoc()) {
    $completed_ids[] = $row['quest_id'];
}

echo json_encode(["status" => "success", "completed_ids" => $completed_ids]);

$conn->close();
