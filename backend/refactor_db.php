<?php
header("Content-Type: application/json");
require_once 'config/dbconnect.php';

$res = ['steps' => []];

// 1. Add doctor_user_id to ocr_history
$check = $conn->query("SHOW COLUMNS FROM ocr_history LIKE 'doctor_user_id'");
if ($check->num_rows === 0) {
    if ($conn->query("ALTER TABLE ocr_history ADD COLUMN doctor_user_id INT NULL AFTER user_id")) {
        $res['steps'][] = "Added doctor_user_id to ocr_history";
    } else {
        $res['steps'][] = "Error adding doctor_user_id: " . $conn->error;
    }
} else {
    $res['steps'][] = "doctor_user_id already exists in ocr_history";
}

// 2. Add note to ocr_history
$check = $conn->query("SHOW COLUMNS FROM ocr_history LIKE 'note'");
if ($check->num_rows === 0) {
    if ($conn->query("ALTER TABLE ocr_history ADD COLUMN note TEXT NULL AFTER image_path")) {
        $res['steps'][] = "Added note to ocr_history";
    } else {
        $res['steps'][] = "Error adding note: " . $conn->error;
    }
} else {
    $res['steps'][] = "note already exists in ocr_history";
}

// 3. Add refined_json to ocr_history
$check = $conn->query("SHOW COLUMNS FROM ocr_history LIKE 'refined_json'");
if ($check->num_rows === 0) {
    if ($conn->query("ALTER TABLE ocr_history ADD COLUMN refined_json LONGTEXT NULL AFTER raw_text")) {
        $res['steps'][] = "Added refined_json to ocr_history";
    } else {
        $res['steps'][] = "Error adding refined_json: " . $conn->error;
    }
} else {
    $res['steps'][] = "refined_json already exists in ocr_history";
}

echo json_encode($res, JSON_PRETTY_PRINT);
