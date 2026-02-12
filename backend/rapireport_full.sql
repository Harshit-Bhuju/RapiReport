-- =============================================================================
-- RapiReport - Full database schema (one file)
-- MariaDB 10.4+ / MySQL 5.7+. Run once (e.g. mysql -u user -p rapireport < rapireport_full.sql)
-- Uses CREATE TABLE IF NOT EXISTS so safe to run on existing DB; no data dropped.
-- =============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
/*!40101 SET NAMES utf8mb4 */;

-- -----------------------------------------------------------------------------
-- 1. USERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `google_id` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `profile_pic` text DEFAULT NULL,
  `role` varchar(50) DEFAULT 'user',
  `age` int(11) DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `conditions` text DEFAULT NULL,
  `custom_conditions` text DEFAULT NULL,
  `parental_history` text DEFAULT NULL,
  `custom_parental_history` text DEFAULT NULL,
  `preferred_language` varchar(10) DEFAULT 'en',
  `profile_complete` tinyint(1) DEFAULT 0,
  `parent_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_login` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `google_id` (`google_id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_parent` (`parent_id`),
  CONSTRAINT `fk_parent` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 2. CHAT_MESSAGES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role` enum('user','bot') NOT NULL,
  `content_en` text NOT NULL,
  `content_ne` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 3. TERRITORY (game)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `territory_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `area_captured_km2` float DEFAULT 0,
  `points_today` int(11) DEFAULT 0,
  `cumulative_points` int(11) DEFAULT 0,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `quests_today` int(11) DEFAULT 0,
  `last_refresh_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user` (`user_id`),
  CONSTRAINT `fk_territory_users_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `territory_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `captured_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_territory_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 4. EXERCISE & QUEST LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `exercise_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `exercise_type` varchar(50) NOT NULL,
  `rep_count` int(11) NOT NULL,
  `video_verified` tinyint(1) DEFAULT 0,
  `duration_seconds` int(11) DEFAULT 0,
  `calories_burned` float DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `exercise_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `quest_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `quest_id` varchar(50) NOT NULL,
  `points_awarded` int(11) DEFAULT 0,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_quest_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 5. DOCTOR PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `doctor_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `specialty` varchar(100) NOT NULL DEFAULT 'General Physician',
  `experience_years` int(11) NOT NULL DEFAULT 0,
  `consultation_rate` int(11) NOT NULL DEFAULT 0,
  `bio` text DEFAULT NULL,
  `qualifications` varchar(255) DEFAULT NULL,
  `languages` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doctor_profiles_user` (`user_id`),
  CONSTRAINT `fk_doctor_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 6. PRESCRIPTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `prescriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `doctor_user_id` int(11) DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL,
  `raw_text` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `doctor_user_id` (`doctor_user_id`),
  CONSTRAINT `fk_prescriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prescriptions_doctor` FOREIGN KEY (`doctor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `prescription_medicines` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `prescription_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `dose` varchar(100) DEFAULT NULL,
  `frequency` varchar(100) DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `raw_line` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `prescription_id` (`prescription_id`),
  CONSTRAINT `fk_rx_meds_prescription` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 7. ADHERENCE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `adherence_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `log_date` date NOT NULL,
  `medicine_name` varchar(255) NOT NULL,
  `slot` varchar(20) NOT NULL,
  `taken` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_adherence_user_date` (`user_id`, `log_date`),
  CONSTRAINT `fk_adherence_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `adherence_reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `medicine_name` varchar(255) NOT NULL,
  `slot` varchar(20) NOT NULL,
  `reminder_time` time NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_reminders_user` (`user_id`),
  CONSTRAINT `fk_reminders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 8. SYMPTOMS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `symptoms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `log_date` date NOT NULL,
  `text` text NOT NULL,
  `severity` varchar(20) NOT NULL DEFAULT 'mild',
  `vitals_json` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_symptoms_user_date` (`user_id`, `log_date`),
  CONSTRAINT `fk_symptoms_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 9. ACTIVITY LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `log_date` date NOT NULL,
  `type` varchar(30) NOT NULL,
  `value` decimal(12,2) NOT NULL,
  `unit` varchar(20) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_activity_user_date` (`user_id`, `log_date`),
  CONSTRAINT `fk_activity_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 10. DIET LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `diet_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `log_date` date NOT NULL,
  `meal_type` varchar(20) NOT NULL,
  `items` text NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_diet_user_date` (`user_id`, `log_date`),
  CONSTRAINT `fk_diet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 11. REWARDS & REDEMPTIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rewards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `points_required` int(11) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `reward_redemptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `reward_id` int(11) NOT NULL,
  `points_spent` int(11) NOT NULL,
  `redeemed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_redemptions_user` (`user_id`),
  KEY `reward_id` (`reward_id`),
  CONSTRAINT `fk_redemptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_redemptions_reward` FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 12. CAMPAIGNS & COMPLETIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` varchar(50) NOT NULL,
  `type` varchar(30) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `points` int(11) NOT NULL DEFAULT 0,
  `deadline` date DEFAULT NULL,
  `cta` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `campaign_completions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `campaign_id` varchar(50) NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_campaign` (`user_id`, `campaign_id`),
  CONSTRAINT `fk_completions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_completions_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 13. CONSULTATIONS (doctor–patient)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `consultations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_user_id` int(11) NOT NULL,
  `patient_user_id` int(11) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'scheduled',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_consultations_doctor` (`doctor_user_id`),
  KEY `ix_consultations_patient` (`patient_user_id`),
  CONSTRAINT `fk_consultations_doctor` FOREIGN KEY (`doctor_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_consultations_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- 14. ASYNC CONSULTATION REQUESTS (telemedicine: patient submits, doctor reviews)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `async_consultation_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_user_id` int(11) NOT NULL,
  `doctor_user_id` int(11) DEFAULT NULL,
  `symptoms_text` text DEFAULT NULL,
  `vitals_json` text DEFAULT NULL,
  `diet_activity_note` text DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `doctor_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_async_patient` (`patient_user_id`),
  KEY `ix_async_doctor` (`doctor_user_id`),
  CONSTRAINT `fk_async_patient` FOREIGN KEY (`patient_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_async_doctor` FOREIGN KEY (`doctor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- -----------------------------------------------------------------------------
-- SEED: Rewards
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `rewards` (`id`, `title`, `points_required`, `icon`, `category`) VALUES
(1, 'Free AI Consultation', 500, 'stethoscope', 'Health'),
(2, 'Lab Test Voucher', 300, 'ticket', 'Health'),
(3, 'Premium Access (1 Week)', 200, 'activity', 'App'),
(4, 'Health Kit Bundle', 1000, 'gift', 'Wellness'),
(5, 'Fitness Band Discount', 800, 'activity', 'Fitness'),
(6, 'Doctor Consult Credit', 600, 'stethoscope', 'Health');

-- -----------------------------------------------------------------------------
-- SEED: Campaigns
-- -----------------------------------------------------------------------------
INSERT IGNORE INTO `campaigns` (`id`, `type`, `title`, `description`, `points`, `deadline`, `cta`) VALUES
('vax_flu_2026', 'vaccination', 'Flu vaccination drive', 'Get your annual flu shot. Log completion to earn 50 points.', 50, '2026-03-31', 'I got vaccinated'),
('checkup_annual_2026', 'checkup', 'Annual health checkup', 'Complete a full body checkup and upload report for 100 points.', 100, '2026-06-30', 'I completed checkup'),
('fit_10k_2026', 'fitness', '10K steps challenge', 'Hit 10,000 steps for 7 days in a row.', 200, '2026-04-15', 'View in Quest Game'),
('vax_covid_booster', 'vaccination', 'COVID-19 booster', 'Log your booster dose for 30 points.', 30, '2026-12-31', 'I got booster');

COMMIT;

-- Optional: assign roles (run manually; replace id)
-- UPDATE users SET role = 'doctor' WHERE id = 5;
-- UPDATE users SET role = 'admin' WHERE id = 1;
