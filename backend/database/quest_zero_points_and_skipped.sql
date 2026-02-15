-- ============================================================
-- RapiReport: Zero all user points + add quest_logs.skipped
-- Run this in phpMyAdmin or mysql CLI against database `rapireport`
-- ============================================================

-- 1) Set all users' quest points to 0 (today and cumulative)
UPDATE territory_users
SET points_today = 0,
    cumulative_points = 0;

-- 2) Add 'skipped' column to quest_logs (run only if column doesn't exist)
--    Tracks whether a quest was completed or skipped; skip = no point deduction
ALTER TABLE quest_logs
ADD COLUMN skipped TINYINT(1) NOT NULL DEFAULT 0
COMMENT '1 = skipped (no points), 0 = completed';
-- If you get "Duplicate column name 'skipped'", the column already exists; skip this step.

-- 3) Optional: backfill existing rows so old "skip" entries (points_awarded <= 0, not bonus) are marked skipped
-- UPDATE quest_logs SET skipped = 1 WHERE points_awarded <= 0 AND quest_id NOT LIKE 'daily_bonus%';
