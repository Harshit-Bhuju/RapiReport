<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

require_once '../config/dbconnect.php';

$user_id = isset($_GET['user_id']) ? $conn->real_escape_string($_GET['user_id']) : 1;
$today = date("Y-m-d");

$has_skipped = false;
$cols = $conn->query("SHOW COLUMNS FROM quest_logs LIKE 'skipped'");
if ($cols && $cols->num_rows > 0) {
    $has_skipped = true;
}

$completed_ids = [];
$skipped_ids = [];

if ($has_skipped) {
    $sql = "SELECT quest_id, skipped FROM quest_logs WHERE user_id = '$user_id' AND DATE(completed_at) = '$today'";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) {
        if (!empty($row['skipped'])) {
            $skipped_ids[] = $row['quest_id'];
        } else {
            $completed_ids[] = $row['quest_id'];
        }
    }
} else {
    $sql = "SELECT quest_id FROM quest_logs WHERE user_id = '$user_id' AND DATE(completed_at) = '$today'";
    $result = $conn->query($sql);
    while ($row = $result->fetch_assoc()) {
        $completed_ids[] = $row['quest_id'];
    }
}

echo json_encode(["status" => "success", "completed_ids" => $completed_ids, "skipped_ids" => $skipped_ids]);

$conn->close();
