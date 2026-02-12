-- Create table for consultation calls
CREATE TABLE IF NOT EXISTS consultation_calls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    room_id VARCHAR(100) NOT NULL UNIQUE,
    status ENUM('scheduled', 'active', 'completed', 'cancelled') DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

-- Ensure appointments table has status column with confirmed value ENUM
-- If you need to modify existing enum:
-- ALTER TABLE appointments MODIFY COLUMN status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'rejected') DEFAULT 'pending';
