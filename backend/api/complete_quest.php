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
$skipped = !empty($data->skipped);
$points = $skipped ? 0 : max(0, isset($data->points) ? intval($data->points) : 0);
$today = date("Y-m-d");

// 1. Log completion/skip (skipped = no points awarded, no deduction)
try {
    $has_skipped_col = false;
    $cols = $conn->query("SHOW COLUMNS FROM quest_logs LIKE 'skipped'");
    if ($cols && $cols->num_rows > 0) {
        $has_skipped_col = true;
    }
    if ($has_skipped_col) {
        $skipped_int = $skipped ? 1 : 0;
        $stmt = $conn->prepare("INSERT INTO quest_logs (user_id, quest_id, points_awarded, skipped) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isii", $user_id, $quest_id, $points, $skipped_int);
    } else {
        $stmt = $conn->prepare("INSERT INTO quest_logs (user_id, quest_id, points_awarded) VALUES (?, ?, ?)");
        $stmt->bind_param("isi", $user_id, $quest_id, $points);
    }
    if (!$stmt->execute()) {
        throw new Exception("Quest log insert failed: " . $stmt->error);
    }

    // 2. Update user stats: when skipped, only increment quests_today (no points change)
    $sql_check = "SELECT last_refresh_date, quests_today FROM territory_users WHERE user_id = '$user_id'";
    $res = $conn->query($sql_check);
    if (!$res) throw new Exception("Stats check failed: " . $conn->error);
    $user_data = $res->fetch_assoc();

    if ($user_data) {
        $new_count = ($user_data['last_refresh_date'] !== $today) ? 1 : intval($user_data['quests_today']) + 1;
        $bonus = 0;
        $total_added_points = $points;

        // Daily Bonus for 10th completion (not skip)
        if (!$skipped && $new_count === 10) {
            $bonus = 500;
            $bonus_quest_id = "daily_bonus_10";
            if ($has_skipped_col) {
                $z = 0;
                $stmt_bonus = $conn->prepare("INSERT INTO quest_logs (user_id, quest_id, points_awarded, skipped) VALUES (?, ?, ?, ?)");
                $stmt_bonus->bind_param("isii", $user_id, $bonus_quest_id, $bonus, $z);
            } else {
                $stmt_bonus = $conn->prepare("INSERT INTO quest_logs (user_id, quest_id, points_awarded) VALUES (?, ?, ?)");
                $stmt_bonus->bind_param("isi", $user_id, $bonus_quest_id, $bonus);
            }
            $stmt_bonus->execute();
            $total_added_points += $bonus;
        }

        if ($user_data['last_refresh_date'] !== $today) {
            $conn->query("UPDATE territory_users SET 
                quests_today = 1, 
                last_refresh_date = '$today',
                cumulative_points = cumulative_points + $total_added_points,
                points_today = $total_added_points,
                yearly_super_points = yearly_super_points + (" . (!$skipped && $new_count === 10 ? 1 : 0) . ")
                WHERE user_id = '$user_id'");
        } else {
            $conn->query("UPDATE territory_users SET 
                quests_today = quests_today + 1, 
                cumulative_points = cumulative_points + $total_added_points,
                points_today = points_today + $total_added_points,
                yearly_super_points = yearly_super_points + (" . (!$skipped && $new_count === 10 ? 1 : 0) . ")
                WHERE user_id = '$user_id'");
        }
    } else {
        // 3. If no row exists, CREATE it (New logic)
        $stmt_insert = $conn->prepare("INSERT INTO territory_users (user_id, quests_today, points_today, cumulative_points, last_refresh_date, yearly_super_points) VALUES (?, 1, ?, ?, ?, 0)");
        $stmt_insert->bind_param("iiis", $user_id, $points, $points, $today);
        if (!$stmt_insert->execute()) {
            throw new Exception("Territory user insert failed: " . $stmt_insert->error);
        }
    }

    $message = $skipped ? "Quest skipped (no points deducted)" : "Quest completed and points awarded";
    echo json_encode(["status" => "success", "message" => $message]);
} catch (Exception $e) {
    $logFile = __DIR__ . '/../logs/app_errors.log';
    $timestamp = date('[Y-m-d H:i:s] ');
    error_log($timestamp . "Complete Quest Error: " . $e->getMessage() . "\n", 3, $logFile);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

if (isset($conn)) $conn->close();
