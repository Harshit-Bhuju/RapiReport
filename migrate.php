<?php
require_once __DIR__ . '/backend/config/dbconnect.php';

$queries = [
    "ALTER TABLE ocr_history ADD COLUMN IF NOT EXISTS image_hash VARCHAR(32) AFTER image_path",
    "ALTER TABLE reports ADD COLUMN IF NOT EXISTS image_hash VARCHAR(32) AFTER lab_name",
    "CREATE TABLE IF NOT EXISTS ai_usage (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        request_date DATE NOT NULL,
        request_count INT DEFAULT 0,
        UNIQUE KEY user_date (user_id, request_date)
    )"
];

foreach ($queries as $sql) {
    if ($conn->query($sql)) {
        echo "Success: $sql\n";
    } else {
        echo "Error ($conn->errno): $conn->error\nQuery: $sql\n";
    }
}
$conn->close();
