<?php
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';
include __DIR__ . '/../config/header.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
    exit;
}

$user_id = $_SESSION['user_id'] ?? null;
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$sql = "SELECT id, user_id, doctor_user_id, note, raw_text, refined_json, image_path, created_at 
        FROM ocr_history 
        WHERE user_id = ? 
        ORDER BY created_at DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();
$list = [];

while ($row = $result->fetch_assoc()) {
    $meds = [];
    if (!empty($row['refined_json'])) {
        $meds_data = json_decode($row['refined_json'], true);
        if (is_array($meds_data)) {
            foreach ($meds_data as $m) {
                $meds[] = [
                    'name' => $m['name'] ?? '',
                    'dose' => $m['dose'] ?? '',
                    'frequency' => $m['frequency'] ?? '',
                    'duration' => $m['duration'] ?? '',
                    'raw' => $m['raw'] ?? $m['raw_line'] ?? ''
                ];
            }
        }
    }

    $list[] = [
        'id' => (string) $row['id'],
        'user_id' => (int) $row['user_id'],
        'doctor_user_id' => $row['doctor_user_id'] ? (int) $row['doctor_user_id'] : null,
        'note' => $row['note'],
        'rawText' => $row['raw_text'],
        'imagePath' => $row['image_path'] ?: null,
        'createdAt' => $row['created_at'],
        'meds' => $meds,
    ];
}
$stmt->close();
$conn->close();
echo json_encode(['status' => 'success', 'data' => $list]);
