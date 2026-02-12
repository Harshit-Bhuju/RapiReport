<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config/dbconnect.php';

// Weekly Leaderboard: Sum points from the last 7 days
$sql = "SELECT 
            u.username as name, 
            u.profile_pic,
            SUM(ql.points_awarded) as points
        FROM quest_logs ql
        JOIN users u ON ql.user_id = u.id
        WHERE ql.completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY ql.user_id
        ORDER BY points DESC
        LIMIT 10";

$result = $conn->query($sql);
$leaderboard = [];

if ($result && $result->num_rows > 0) {
    $rank = 1;
    while ($row = $result->fetch_assoc()) {
        $row['rank'] = $rank++;
        $row['points'] = intval($row['points']);
        $leaderboard[] = $row;
    }
}


// Return empty array if no data (shows "No explorers yet" instead of mock data)
echo json_encode(["status" => "success", "data" => $leaderboard]);
$conn->close();
