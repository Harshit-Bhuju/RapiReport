-- Migration: Reports & Report Analysis
-- Purpose: Store lab/diagnostic reports with AI analysis (like prescription flow)

CREATE TABLE IF NOT EXISTS `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `lab_name` varchar(255) DEFAULT NULL,
  `report_type` varchar(255) DEFAULT NULL,
  `report_date` date DEFAULT NULL,
  `raw_text` text DEFAULT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `ai_summary_en` text DEFAULT NULL,
  `ai_summary_ne` text DEFAULT NULL,
  `overall_status` varchar(20) DEFAULT 'normal',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_reports_user` (`user_id`),
  CONSTRAINT `fk_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `report_tests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` int(11) NOT NULL,
  `test_name` varchar(255) NOT NULL,
  `result` varchar(100) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `ref_range` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'normal',
  PRIMARY KEY (`id`),
  KEY `ix_report_tests_report` (`report_id`),
  CONSTRAINT `fk_report_tests_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;
