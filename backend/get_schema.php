<?php
header("Content-Type: application/json");
require_once 'config/dbconnect.php';

$tables = ['ocr_history', 'prescriptions', 'prescription_medicines'];
$res = [];

foreach ($tables as $table) {
    $q = $conn->query("DESCRIBE $table");
    if ($q) {
        $res[$table] = [];
        while ($row = $q->fetch_assoc()) $res[$table][] = $row;
    } else {
        $res[$table] = "Error: " . $conn->error;
    }
}

echo json_encode($res, JSON_PRETTY_PRINT);
