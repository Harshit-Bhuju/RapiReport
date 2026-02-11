-- Territory Game Schema

CREATE TABLE IF NOT EXISTS `territory_users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL, -- Links to your main users table if exists, or just stores ID
  `username` VARCHAR(255) NOT NULL,
  `area_captured_km2` FLOAT DEFAULT 0,
  `points_today` INT DEFAULT 0,
  `cumulative_points` INT DEFAULT 0,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_user` (`user_id`)
);

CREATE TABLE IF NOT EXISTS `territory_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `captured_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
