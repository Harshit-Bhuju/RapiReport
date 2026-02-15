-- Add appointment_id to consultation_messages for per-appointment chat threads
ALTER TABLE consultation_messages
ADD COLUMN appointment_id INT NULL AFTER receiver_id,
ADD INDEX idx_appointment (appointment_id);
