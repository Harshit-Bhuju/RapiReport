<?php
require_once __DIR__ . '/../config/session_config.php';
require_once __DIR__ . '/../config/dbconnect.php';
include __DIR__ . '/../config/header.php';

$user_id = $_SESSION['user_id'] ?? null;
$patient_id = isset($_GET['patient_id']) ? (int) $_GET['patient_id'] : 0;

if (!$user_id || !$patient_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$role = $_SESSION['role'] ?? null;
if (!$role) {
    $r = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $r->bind_param('i', $user_id);
    $r->execute();
    $rr = $r->get_result();
    if ($rr && $rr->num_rows) {
        $role = $rr->fetch_assoc()['role'];
    }
    $r->close();
}

if ($role !== 'doctor') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Doctor access required']);
    exit;
}

// Verify this doctor has/had an appointment with this patient
$checkApp = $conn->prepare("SELECT 1 FROM appointments WHERE doctor_user_id = ? AND patient_user_id = ? LIMIT 1");
$checkApp->bind_param('ii', $user_id, $patient_id);
$checkApp->execute();
if ($checkApp->get_result()->num_rows === 0) {
    $checkApp->close();
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'No appointment with this patient']);
    exit;
}
$checkApp->close();

try {
    $profile = null;
    $profileStmt = $conn->prepare("
        SELECT username, email, age, dob, gender, blood_group,
               conditions, custom_conditions, parental_history, custom_parental_history,
               profile_pic
        FROM users WHERE id = ?
    ");
    $profileStmt->bind_param('i', $patient_id);
    $profileStmt->execute();
    $profileRow = $profileStmt->get_result()->fetch_assoc();
    $profileStmt->close();
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

    $symptoms = [];
    $sympStmt = $conn->prepare("
        SELECT id, log_date AS date, text, severity, vitals_json, created_at
        FROM symptoms WHERE user_id = ?
        ORDER BY log_date DESC, created_at DESC LIMIT 50
    ");
    $sympStmt->bind_param('i', $patient_id);
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

    $reports = [];
    $tableCheck = $conn->query("SHOW TABLES LIKE 'reports'");
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $repStmt = $conn->prepare("
            SELECT id, lab_name, report_type, report_date, overall_status, ai_summary_en, ai_summary_ne, raw_text, created_at
            FROM reports WHERE user_id = ?
            ORDER BY created_at DESC LIMIT 20
        ");
        $repStmt->bind_param('i', $patient_id);
        $repStmt->execute();
        $repRes = $repStmt->get_result();
        while ($row = $repRes->fetch_assoc()) {
            $rid = (int) $row['id'];
            $testsStmt = $conn->prepare("SELECT test_name, result, unit, ref_range, status FROM report_tests WHERE report_id = ?");
            $testsStmt->bind_param('i', $rid);
            $testsStmt->execute();
            $testsResult = $testsStmt->get_result();
            $tests = [];
            while ($t = $testsResult->fetch_assoc()) {
                $tests[] = [
                    'name' => $t['test_name'],
                    'result' => $t['result'],
                    'unit' => $t['unit'],
                    'range' => $t['ref_range'],
                    'status' => $t['status'],
                ];
            }
            $testsStmt->close();
            $reports[] = [
                'id' => (string) $rid,
                'lab' => $row['lab_name'],
                'type' => $row['report_type'],
                'date' => $row['report_date'],
                'status' => $row['overall_status'],
                'summary' => $row['ai_summary_en'],
                'summaryNe' => $row['ai_summary_ne'],
                'rawText' => $row['raw_text'],
                'tests' => $tests,
                'createdAt' => $row['created_at'],
            ];
        }
        $repStmt->close();
    }

    // 4. Recent prescriptions (last 20) - fetched from ocr_history
    $prescriptions = [];
    $rxStmt = $conn->prepare("SELECT id, note, raw_text, refined_json, image_path, created_at FROM ocr_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 20");
    if ($rxStmt) {
        $rxStmt->bind_param('i', $patient_id);
        $rxStmt->execute();
        $rxRes = $rxStmt->get_result();
        while ($row = $rxRes->fetch_assoc()) {
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

            $prescriptions[] = [
                'id' => (string) $row['id'],
                'note' => $row['note'],
                'rawText' => $row['raw_text'],
                'imagePath' => $row['image_path'] ?: null,
                'createdAt' => $row['created_at'],
                'meds' => $meds,
            ];
        }
        $rxStmt->close();
    }

    $summaryLines = [];
    if ($profile) {
        if (!empty($profile['conditions'])) $summaryLines[] = 'Conditions: ' . $profile['conditions'];
        if (!empty($profile['allergies'])) $summaryLines[] = 'Allergies: ' . $profile['allergies'];
    }
    $summaryLines[] = count($symptoms) . ' symptom(s) logged';
    $summaryLines[] = count($prescriptions) . ' prescription(s)';
    $summaryLines[] = count($reports) . ' report(s)';

    echo json_encode([
        'status' => 'success',
        'data' => [
            'profile' => $profile,
            'symptoms' => $symptoms,
            'reports' => $reports,
            'prescriptions' => $prescriptions,
            'summaryText' => implode(' • ', $summaryLines),
        ],
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to load health data: ' . $e->getMessage()]);
} finally {
    $conn->close();
}
