-- Create chat_sessions table to group messages by topic
CREATE TABLE IF NOT EXISTS `chat_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_chat_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add session_id to chat_messages to link messages to a specific session
ALTER TABLE `chat_messages` ADD COLUMN `session_id` int(11) DEFAULT NULL AFTER `user_id`;

-- Add foreign key constraint to chat_messages
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `fk_chat_messages_session` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE;
