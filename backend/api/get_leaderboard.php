<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once '../config/dbconnect.php';

// Fetch top 10 users sorted by points_today (or cumulative_points)
$sql = "SELECT username, points_today, cumulative_points, area_captured_km2 FROM territory_users ORDER BY points_today DESC LIMIT 10";
$result = $conn->query($sql);

$leaderboard = [];

if ($result->num_rows > 0) {
    $rank = 1;
    while($row = $result->fetch_assoc()) {
        $row['rank'] = $rank++;
        // Add a mock avatar based on name if not real
        $row['avatar'] = "https://ui-avatars.com/api/?name=" . urlencode($row['username']) . "&background=random";
        $leaderboard[] = $row;
    }
}

echo json_encode($leaderboard);

$conn->close();
?>
