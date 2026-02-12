<?php
// Lightweight bootstrap to ensure call tables exist for consultation WebRTC calls

if (!function_exists('rr_ensure_consultation_call_tables')) {
    /**
     * Ensure the minimal tables for consultation calls + signaling exist.
     * Safe to call on every request (uses CREATE TABLE IF NOT EXISTS).
     */
    function rr_ensure_consultation_call_tables(mysqli $conn): void
    {
        // Main call metadata (who is calling whom)
        $conn->query("
            CREATE TABLE IF NOT EXISTS consultation_calls (
                id INT AUTO_INCREMENT PRIMARY KEY,
                appointment_id INT NOT NULL,
                room_id VARCHAR(64) NOT NULL,
                caller_user_id INT NOT NULL DEFAULT 0,
                status ENUM('ringing', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'ringing',
                start_time TIMESTAMP NULL DEFAULT NULL,
                end_time TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                KEY idx_room (room_id),
                KEY idx_appointment (appointment_id),
                KEY idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        ");

        // Signaling messages (SDP offers/answers + ICE candidates)
        $conn->query("
            CREATE TABLE IF NOT EXISTS consultation_call_signals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id VARCHAR(64) NOT NULL,
                from_user_id INT NOT NULL,
                to_user_id INT NOT NULL,
                type VARCHAR(32) NOT NULL,
                payload_json LONGTEXT NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                KEY idx_room_to (room_id, to_user_id, id),
                KEY idx_from (from_user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        ");

        // Migration: Ensure caller_user_id exists (if table was already created without it)
        $checkCol = $conn->query("SHOW COLUMNS FROM consultation_calls LIKE 'caller_user_id'");
        if ($checkCol && $checkCol->num_rows === 0) {
            $conn->query("ALTER TABLE consultation_calls ADD COLUMN caller_user_id INT NOT NULL DEFAULT 0 AFTER room_id");
        }
    }
}
