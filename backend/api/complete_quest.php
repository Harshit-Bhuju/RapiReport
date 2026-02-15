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
    $new_count = ($user_data['last_refresh_date'] !== $today) ? 1 : intval($user_data['quests_today']) + 1;
    $bonus = 0;

    // Award 500 bonus points on the 10th quest
    if ($new_count === 10) {
        $bonus = 500;
        // Log the bonus separately in quest_logs for transparency
        $bonus_quest_id = "daily_bonus_10";
        $stmt_bonus = $conn->prepare("INSERT INTO quest_logs (user_id, quest_id, points_awarded) VALUES (?, ?, ?)");
        $stmt_bonus->bind_param("isi", $user_id, $bonus_quest_id, $bonus);
        $stmt_bonus->execute();
    }

    $total_added_points = $points + $bonus;

    if ($user_data['last_refresh_date'] !== $today) {
        $sql_update = "UPDATE territory_users SET 
                      quests_today = 1, 
                      last_refresh_date = '$today',
                      cumulative_points = cumulative_points + $total_added_points,
                      points_today = $total_added_points,
                      yearly_super_points = yearly_super_points + " . ($new_count === 10 ? 1 : 0) . "
                      WHERE user_id = '$user_id'";
    } else {
        $sql_update = "UPDATE territory_users SET 
                      quests_today = quests_today + 1, 
                      cumulative_points = cumulative_points + $total_added_points,
                      points_today = points_today + $total_added_points,
                      yearly_super_points = yearly_super_points + " . ($new_count === 10 ? 1 : 0) . "
                      WHERE user_id = '$user_id'";
    }
    $conn->query($sql_update);
}

$message = ($points < 0) ? "Quest skipped and points deducted" : "Quest logged and points awarded";
echo json_encode(["status" => "success", "message" => $message]);
$conn->close();
