<?php
require_once __DIR__ . '/../api/cors.php';
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';
require_once __DIR__ . '/../config/mail.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get inviter info
$stmt0 = $conn->prepare("SELECT username, gender FROM users WHERE id = ?");
$stmt0->bind_param("i", $user_id);
$stmt0->execute();
$inviter = $stmt0->get_result()->fetch_assoc();
$inviterName = $inviter['username'] ?? 'Family Member';
$inviterGender = strtolower(trim($inviter['gender'] ?? 'male'));

$rawData = file_get_contents("php://input");
$data = json_decode($rawData, true) ?: [];

$email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
$relation = isset($data['relation']) ? trim($data['relation']) : '';

if (empty($email)) {
    echo json_encode(['status' => 'error', 'message' => 'Email is required']);
    exit;
}

// 1. Check if user already exists
$stmt = $conn->prepare("SELECT id, username, email, profile_pic FROM users WHERE email = ? LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$target = $result->fetch_assoc();

if ($target && (int)$target['id'] === (int)$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'You cannot add yourself']);
    exit;
}

$target_user_id = null;
if ($target) {
    $target_user_id = $target['id'];
} else {
    // Strictly require the user to exist in the system
    echo json_encode(['status' => 'error', 'message' => 'User not found with that email. Please ask them to register first.']);
    exit;
}

// 2. Determine Inverse Relation
$inverse_mapping = [
    'male' => [
        'Brother' => 'Brother',
        'Sister' => 'Brother',
        'Father' => 'Son',
        'Mother' => 'Son',
        'Grandfather' => 'Grandson',
        'Grandmother' => 'Grandson',
        'Son' => 'Father',
        'Daughter' => 'Father',
        'Other' => 'Other'
    ],
    'female' => [
        'Brother' => 'Sister',
        'Sister' => 'Sister',
        'Father' => 'Daughter',
        'Mother' => 'Daughter',
        'Grandfather' => 'Granddaughter',
        'Grandmother' => 'Granddaughter',
        'Son' => 'Mother',
        'Daughter' => 'Mother',
        'Other' => 'Other'
    ]
];

$gender_key = ($inviterGender === 'female' || $inviterGender === 'f') ? 'female' : 'male';
$inverseRelation = $inverse_mapping[$gender_key][$relation] ?? 'Other';

// 3. Check if already linked
$stmt2 = $conn->prepare("SELECT id FROM family_members WHERE user_id = ? AND member_user_id = ?");
$stmt2->bind_param("ii", $user_id, $target_user_id);
$stmt2->execute();
if ($stmt2->get_result()->num_rows > 0) {
    echo json_encode(['status' => 'error', 'message' => 'This member is already in your family or invited']);
    exit;
}

// 4. Generate invitation token
$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+7 days'));

// 5. Insert the link with pending status
$stmt3 = $conn->prepare("INSERT INTO family_members (user_id, member_user_id, relation, inverse_relation, status, invitation_token, token_expires) VALUES (?, ?, ?, ?, 'pending', ?, ?)");
$stmt3->bind_param("iissss", $user_id, $target_user_id, $relation, $inverseRelation, $token, $expires);
$stmt3->execute();

$invite_id = $stmt3->insert_id;

// 6. Return success response
echo json_encode([
    'status' => 'success',
    'message' => 'Invitation sent to ' . $email,
    'invitation' => [
        'id' => $invite_id,
        'email' => $email,
        'status' => 'pending'
    ]
]);
exit;
