<?php
include(__DIR__ . "/dbconnect.php");
// ngrok http 80 --pooling-enabled
// ngrok http 5173 --pooling-enabled

$allowedOrigins = [
    "http://localhost:5173",
    "http://192.168.1.8:5173",
    "https://www.harshitbhuju.com.np",
    "https://harshitbhuju.com.np",
    "https://harmanbhuju.com.np"
    // Replace with your LAN IP of frontend device
];
// $_SERVER['HTTP_ORIGIN'] shows localhost:5173 or LAN IP of frontend device
//browser le  kun link bata request gareko ho bhanera thah pauna ko lagi
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}
// this is called cors error
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");
