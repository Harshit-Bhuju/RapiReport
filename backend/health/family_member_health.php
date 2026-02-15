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
$member_id = isset($_GET['member_id']) ? (int) $_GET['member_id'] : 0;

if ($member_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'member_id is required']);
    exit;
}

// Verify family relationship (accepted, either direction)
$check = $conn->prepare("
    SELECT 1 FROM family_members
    WHERE status = 'accepted'
      AND (
          (user_id = ? AND member_user_id = ?)
          OR
          (user_id = ? AND member_user_id = ?)
      )
    LIMIT 1
");
$check->bind_param('iiii', $user_id, $member_id, $member_id, $user_id);
$check->execute();
$checkRes = $check->get_result();

if ($checkRes->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Not an accepted family member']);
    exit;
}
$check->close();

try {
    // 1. Get profile info (users table has conditions, custom_conditions, parental_history - no allergies column)
    $profileStmt = $conn->prepare("
        SELECT username, email, age, dob, gender, blood_group,
               conditions, custom_conditions, parental_history, custom_parental_history,
               profile_pic
        FROM users WHERE id = ?
    ");
    if (!$profileStmt) throw new Exception("Profile query preparation failed");
    $profileStmt->bind_param('i', $member_id);
    $profileStmt->execute();
    $profileRow = $profileStmt->get_result()->fetch_assoc();
    $profileStmt->close();

    $profile = null;
    if ($profileRow) {
        $profile = [
            'username' => $profileRow['username'],
            'email' => $profileRow['email'],
            'age' => $profileRow['age'],
            'dob' => $profileRow['dob'],
            'gender' => $profileRow['gender'],
            'bloodGroup' => $profileRow['blood_group'],
            'conditions' => $profileRow['conditions'],
            'allergies' => null,
            'parentalHistory' => json_decode($profileRow['parental_history'] ?? '[]', true),
            'customParentalHistory' => $profileRow['custom_parental_history'],
            'profilePic' => $profileRow['profile_pic'],
        ];
    }

    // 2. Recent symptoms (last 10)
    $symptoms = [];
    $sympStmt = $conn->prepare("
        SELECT id, log_date AS date, text, severity, vitals_json, created_at
        FROM symptoms WHERE user_id = ?
        ORDER BY log_date DESC, created_at DESC LIMIT 10
    ");
    if ($sympStmt) {
        $sympStmt->bind_param('i', $member_id);
        $sympStmt->execute();
        $sympRes = $sympStmt->get_result();
        while ($row = $sympRes->fetch_assoc()) {
            $symptoms[] = [
                'id' => (int) $row['id'],
                'date' => $row['date'],
                'text' => $row['text'],
                'severity' => $row['severity'],
                'vitals' => $row['vitals_json'] ? json_decode($row['vitals_json'], true) : null,
                'createdAt' => $row['created_at'],
            ];
        }
        $sympStmt->close();
    }

    // 3. Recent reports (last 10)
    $reports = [];
    $tableCheck = $conn->query("SHOW TABLES LIKE 'reports'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $repStmt = $conn->prepare("
            SELECT id, lab_name, report_type, report_date, overall_status, ai_summary_en, created_at
            FROM reports WHERE user_id = ?
            ORDER BY created_at DESC LIMIT 10
        ");
        if ($repStmt) {
            $repStmt->bind_param('i', $member_id);
            $repStmt->execute();
            $repRes = $repStmt->get_result();
            while ($row = $repRes->fetch_assoc()) {
                $rid = (int) $row['id'];
                // Count tests for this report
                $testCount = 0;
                $tcStmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM report_tests WHERE report_id = ?");
                if ($tcStmt) {
                    $tcStmt->bind_param('i', $rid);
                    $tcStmt->execute();
                    $tcRow = $tcStmt->get_result()->fetch_assoc();
                    $testCount = (int) ($tcRow['cnt'] ?? 0);
                    $tcStmt->close();
                }
                $reports[] = [
                    'id' => (string) $rid,
                    'lab' => $row['lab_name'],
                    'type' => $row['report_type'],
                    'date' => $row['report_date'],
                    'status' => $row['overall_status'],
                    'summary' => $row['ai_summary_en'],
                    'testCount' => $testCount,
                    'createdAt' => $row['created_at'],
                ];
            }
            $repStmt->close();
        }
    }

    // 4. Recent prescriptions (last 10)
    $prescriptions = [];
    $hasImagePath = false;
    $rxCols = $conn->query("SHOW COLUMNS FROM prescriptions LIKE 'image_path'");
    if ($rxCols && $rxCols->num_rows > 0) $hasImagePath = true;
    $rxColsStr = $hasImagePath ? "id, note, raw_text, image_path, created_at" : "id, note, raw_text, created_at";
    $rxStmt = $conn->prepare("SELECT $rxColsStr FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10");
    if ($rxStmt) {
        $rxStmt->bind_param('i', $member_id);
        $rxStmt->execute();
        $rxRes = $rxStmt->get_result();
        while ($row = $rxRes->fetch_assoc()) {
            $rxId = (int) $row['id'];
            // Fetch medicines for this prescription
            $meds = [];
            $medsStmt = $conn->prepare("SELECT name, dose, frequency, duration FROM prescription_medicines WHERE prescription_id = ?");
            if ($medsStmt) {
                $medsStmt->bind_param('i', $rxId);
                $medsStmt->execute();
                $medsRes = $medsStmt->get_result();
                while ($m = $medsRes->fetch_assoc()) {
                    $meds[] = $m;
                }
                $medsStmt->close();
            }
            $prescriptions[] = [
                'id' => (string) $rxId,
                'note' => $row['note'],
                'rawText' => $row['raw_text'],
                'imagePath' => ($hasImagePath && isset($row['image_path'])) ? $row['image_path'] : null,
                'createdAt' => $row['created_at'],
                'meds' => $meds,
            ];
        }
        $rxStmt->close();
    }

    echo json_encode([
        'status' => 'success',
        'data' => [
            'profile' => $profile,
            'symptoms' => $symptoms,
            'reports' => $reports,
            'prescriptions' => $prescriptions,
        ],
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to load health data: ' . $e->getMessage()
    ]);
} finally {
    $conn->close();
}
