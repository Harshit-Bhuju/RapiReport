<?php
// Lightweight bootstrap to ensure call tables exist for family WebRTC calls

if (!function_exists('rr_ensure_family_call_tables')) {
    /**
     * Ensure the minimal tables for family calls + signaling exist.
     * Safe to call on every request (uses CREATE TABLE IF NOT EXISTS).
     */
    function rr_ensure_family_call_tables(mysqli $conn): void
    {
        // Main call metadata (who is calling whom)
        $conn->query("
            CREATE TABLE IF NOT EXISTS family_calls (
                id INT AUTO_INCREMENT PRIMARY KEY,
                room_id VARCHAR(64) NOT NULL,
                caller_user_id INT NOT NULL,
                callee_user_id INT NOT NULL,
                status ENUM('ringing', 'active', 'ended') NOT NULL DEFAULT 'ringing',
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                accepted_at TIMESTAMP NULL DEFAULT NULL,
                ended_at TIMESTAMP NULL DEFAULT NULL,
                KEY idx_room (room_id),
                KEY idx_callee_status (callee_user_id, status),
                KEY idx_caller (caller_user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        ");

        // Signaling messages (SDP offers/answers + ICE candidates)
        $conn->query("
            CREATE TABLE IF NOT EXISTS family_call_signals (
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
    }
}

