-- Add column for Yearly Super Points analytics to territory_users table
ALTER TABLE territory_users ADD COLUMN IF NOT EXISTS yearly_super_points INT DEFAULT 0;

-- Optional: Initialize with 0 for existing users
UPDATE territory_users SET yearly_super_points = 0 WHERE yearly_super_points IS NULL;
