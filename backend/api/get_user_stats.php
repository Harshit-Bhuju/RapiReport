<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config/dbconnect.php';

$user_id = isset($_GET['user_id']) ? $conn->real_escape_string($_GET['user_id']) : 1; // Default for testing
$today = date("Y-m-d");

try {
    $sql = "SELECT * FROM territory_users WHERE user_id = '$user_id'";
    $result = $conn->query($sql);
    if (!$result) throw new Exception("Stats query failed: " . $conn->error);
    $stats = $result->fetch_assoc();

    if ($stats) {
        // Check for daily refresh
        if ($stats['last_refresh_date'] !== $today) {
            $conn->query("UPDATE territory_users SET quests_today = 0, points_today = 0, last_refresh_date = '$today' WHERE user_id = '$user_id'");
            $stats['quests_today'] = 0;
            $stats['points_today'] = 0;
        }

        // Calculate Weekly Valid Points (earned in last 7 days)
        $sql_weekly = "SELECT SUM(points_awarded) as total FROM quest_logs 
                       WHERE user_id = '$user_id' 
                       AND points_awarded > 0
                       AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $res_weekly = $conn->query($sql_weekly);
        if (!$res_weekly) throw new Exception("Weekly points query failed: " . $conn->error);
        $weekly_data = $res_weekly->fetch_assoc();
        $stats['weekly_points'] = intval($weekly_data['total'] ?? 0);

        // Fetch Daily Earnings for the last 7 days (Analytics)
        $sql_daily = "SELECT DATE(completed_at) as date, SUM(points_awarded) as points 
                      FROM quest_logs 
                      WHERE user_id = '$user_id' 
                      AND points_awarded > 0
                      AND completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                      GROUP BY DATE(completed_at)
                      ORDER BY date DESC";
        $res_daily = $conn->query($sql_daily);
        if (!$res_daily) throw new Exception("Daily earnings query failed: " . $conn->error);
        $daily_earnings = [];
        while ($row = $res_daily->fetch_assoc()) {
            $daily_earnings[] = $row;
        }
        $stats['daily_earnings'] = $daily_earnings;

        echo json_encode(["status" => "success", "data" => $stats]);
    } else {
        // Return defaults if new user
        echo json_encode([
            "status" => "success",
            "data" => [
                "points_today" => 0,
                "cumulative_points" => 0,
                "weekly_points" => 0,
                "quests_today" => 0
            ]
        ]);
    }
} catch (Exception $e) {
    $logFile = __DIR__ . '/../logs/app_errors.log';
    $timestamp = date('[Y-m-d H:i:s] ');
    error_log($timestamp . "Get User Stats Error: " . $e->getMessage() . "\n", 3, $logFile);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

if (isset($conn)) $conn->close();
