<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/dbconnect.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->user_id) || !isset($data->quest_id)) {
    echo json_encode(["status" => "error", "message" => "Invalid input"]);
    exit();
}

$user_id = $conn->real_escape_string($data->user_id);
$quest_id = $conn->real_escape_string($data->quest_id);
$points = isset($data->points) ? intval($data->points) : 0;
$today = date("Y-m-d");

// 1. Log completion for analytics
$stmt = $conn->prepare("INSERT INTO quest_logs (user_id, quest_id, points_awarded) VALUES (?, ?, ?)");
$stmt->bind_param("isi", $user_id, $quest_id, $points);
$stmt->execute();

// 2. Update user stats and daily count
// Check if refresh is needed
$sql_check = "SELECT last_refresh_date, quests_today FROM territory_users WHERE user_id = '$user_id'";
$res = $conn->query($sql_check);
$user_data = $res->fetch_assoc();

if ($user_data) {
    if ($user_data['last_refresh_date'] !== $today) {
        $sql_update = "UPDATE territory_users SET 
                      quests_today = 1, 
                      last_refresh_date = '$today',
                      cumulative_points = cumulative_points + $points,
                      points_today = $points
                      WHERE user_id = '$user_id'";
    } else {
        $sql_update = "UPDATE territory_users SET 
                      quests_today = quests_today + 1, 
                      cumulative_points = cumulative_points + $points,
                      points_today = points_today + $points
                      WHERE user_id = '$user_id'";
    }
    $conn->query($sql_update);
}

echo json_encode(["status" => "success", "message" => "Quest logged and points awarded"]);
$conn->close();
