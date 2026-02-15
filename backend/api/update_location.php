<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/dbconnect.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->lat) || !isset($data->lng)) {
    echo json_encode(["status" => "error", "message" => "Invalid input"]);
    exit();
}

$user_id = $conn->real_escape_string($data->user_id);
$lat = $conn->real_escape_string($data->lat);
$lng = $conn->real_escape_string($data->lng);
$area_added = isset($data->area_added) ? floatval($data->area_added) : 0;
$points_added = isset($data->points_added) ? intval($data->points_added) : 0;

// 1. Log the location (REMOVED: territory_logs table has been deleted)
// 2. Update User Stats (Insert if new, Update if exists)
// Using logic from frontend for accuracy
$sql_user = "INSERT INTO territory_users (user_id, points_today, cumulative_points)
             VALUES ('$user_id', '$points_added', '$points_added')
             ON DUPLICATE KEY UPDATE 
             points_today = points_today + VALUES(points_today),
             cumulative_points = cumulative_points + VALUES(cumulative_points)";

if ($conn->query($sql_user) === TRUE) {
    // Fetch updated stats to return
    $result = $conn->query("SELECT * FROM territory_users WHERE user_id = '$user_id'");
    $user_stats = $result->fetch_assoc();

    echo json_encode([
        "status" => "success",
        "data" => $user_stats,
        "message" => "Territory captured!"
    ]);
} else {
    echo json_encode(["status" => "error", "message" => $conn->error]);
}

$conn->close();
