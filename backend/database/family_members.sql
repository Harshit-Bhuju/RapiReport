-- Family Members table
-- Links two users together as family members
CREATE TABLE IF NOT EXISTS family_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'The user who added the member',
    member_user_id INT NOT NULL COMMENT 'The user being added as family',
    relation VARCHAR(50) DEFAULT '' COMMENT 'e.g. Mother, Father, Brother',
    status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_pair (user_id, member_user_id),
    INDEX idx_user (user_id),
    INDEX idx_member (member_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
