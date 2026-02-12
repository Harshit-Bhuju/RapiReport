<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

// Ensure messages table exists (idempotent)
$conn->query("
    CREATE TABLE IF NOT EXISTS family_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        family_link_id INT NOT NULL,
        from_user_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_link_created (family_link_id, created_at),
        CONSTRAINT fk_family_messages_link FOREIGN KEY (family_link_id) REFERENCES family_members(id) ON DELETE CASCADE,
        CONSTRAINT fk_family_messages_user FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
");

/**
 * Validate that the current user belongs to this family link and link is accepted.
 */
function get_valid_link(mysqli $conn, int $link_id, int $user_id): ?array
{
    $stmt = $conn->prepare("
        SELECT id, user_id, member_user_id, status
        FROM family_members
        WHERE id = ? AND status = 'accepted' AND (user_id = ? OR member_user_id = ?)
        LIMIT 1
    ");
    $stmt->bind_param('iii', $link_id, $user_id, $user_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $link = $res->fetch_assoc();
    return $link ?: null;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];

    $link_id = isset($data['link_id']) ? (int) $data['link_id'] : 0;
    $message = isset($data['message']) ? trim($data['message']) : '';

    if ($link_id <= 0 || $message === '') {
        echo json_encode(['status' => 'error', 'message' => 'Invalid payload']);
        exit;
    }

    $link = get_valid_link($conn, $link_id, $user_id);
    if (!$link) {
        echo json_encode(['status' => 'error', 'message' => 'Not authorized for this conversation']);
        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO family_messages (family_link_id, from_user_id, message)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param('iis', $link_id, $user_id, $message);

    if (!$stmt->execute()) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to send message']);
        exit;
    }

    echo json_encode([
        'status' => 'success',
        'id' => (int) $stmt->insert_id,
    ]);
    exit;
}

// GET: fetch messages for a family link
$link_id = isset($_GET['link_id']) ? (int) $_GET['link_id'] : 0;
if ($link_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'link_id is required']);
    exit;
}

$link = get_valid_link($conn, $link_id, $user_id);
if (!$link) {
    echo json_encode(['status' => 'error', 'message' => 'Not authorized for this conversation']);
    exit;
}

$stmt = $conn->prepare("
    SELECT id, family_link_id, from_user_id, message, created_at
    FROM family_messages
    WHERE family_link_id = ?
    ORDER BY created_at ASC, id ASC
    LIMIT 200
");
$stmt->bind_param('i', $link_id);
$stmt->execute();
$res = $stmt->get_result();

$messages = [];
while ($row = $res->fetch_assoc()) {
    $messages[] = [
        'id' => (int) $row['id'],
        'family_link_id' => (int) $row['family_link_id'],
        'from_user_id' => (int) $row['from_user_id'],
        'message' => $row['message'],
        'created_at' => $row['created_at'],
    ];
}

echo json_encode([
    'status' => 'success',
    'current_user_id' => $user_id,
    'messages' => $messages,
]);

