-- =============================================================================
-- Theta Updates: OCR History & Prescription Enhancements
-- =============================================================================

-- 1. OCR_HISTORY
-- Stores records of images processed by the OCR engine
CREATE TABLE IF NOT EXISTS `ocr_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `raw_text` text DEFAULT NULL,
  `refined_text` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_ocr_user` (`user_id`),
  CONSTRAINT `fk_ocr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. ENHANCED PRESCRIPTION METADATA
-- Adding fields to prescriptions if not already present
-- (Note: user_id and doctor_user_id are already in the main schema)
ALTER TABLE `prescriptions` ADD COLUMN IF NOT EXISTS `status` varchar(20) DEFAULT 'finalized';
ALTER TABLE `prescriptions` ADD COLUMN IF NOT EXISTS `valid_until` date DEFAULT NULL;

-- 3. MEDICINE ENHANCEMENTS
-- Ensuring detailed fields for structured prescriptions
ALTER TABLE `prescription_medicines` ADD COLUMN IF NOT EXISTS `frequency_slots` varchar(100) DEFAULT NULL COMMENT 'e.g. 1-0-1';
ALTER TABLE `prescription_medicines` ADD COLUMN IF NOT EXISTS `instruction` varchar(255) DEFAULT NULL COMMENT 'e.g. Before food';

COMMIT;
