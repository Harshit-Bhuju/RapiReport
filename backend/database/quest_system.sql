-- SQL SCHEMA FOR RAPIREPORT QUEST & ANALYTICS

-- 1. Table for logging every quest completion (Analytics Source)
CREATE TABLE IF NOT EXISTS `quest_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `quest_id` varchar(100) NOT NULL,
  `points_awarded` int(11) NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`, `completed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Table for caching user game statistics (Performance Optimization)
CREATE TABLE IF NOT EXISTS `territory_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `points_today` int(11) DEFAULT 0,
  `cumulative_points` int(11) DEFAULT 0,
  `quests_today` int(11) DEFAULT 0,
  `last_refresh_date` date DEFAULT NULL,
  `area_captured_km2` float DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ANALYTICS QUERIES

-- A. Calculate Weekly Valid Points (Points earned within last 7 days)
-- This is what determines if points have "expired"
SELECT 
    user_id, 
    SUM(points_awarded) as valid_points 
FROM quest_logs 
WHERE completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY user_id;

-- B. Weekly Leaderboard Query
-- Fetches Top 10 Explorers based on points earned in the last week
SELECT 
    u.username, 
    u.profile_pic,
    SUM(ql.points_awarded) as weekly_points
FROM quest_logs ql
JOIN users u ON ql.user_id = u.id
WHERE ql.completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY ql.user_id
ORDER BY weekly_points DESC
LIMIT 10;
