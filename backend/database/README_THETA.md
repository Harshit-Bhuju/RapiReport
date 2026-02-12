# Theta Database Updates Guide

I have created a specialized SQL file to enhance the database with OCR history tracking and structured prescription fields.

### Files

- SQL script: [theta_updates.sql](file:///c:/Users/User/OneDrive/Desktop/Rapireport/backend/database/theta_updates.sql)

### How to Apply

1. Open your database management tool (e.g., phpMyAdmin or MySQL Workbench).
2. Select the `rapireport` database.
3. Go to the **Import** or **SQL** tab.
4. Upload or paste the contents of `theta_updates.sql`.
5. Run the query.

### What's New

- **`ocr_history` table**: Automatically logs every OCR scan with user ID and results.
- **Structured Fields**: Added `frequency_slots` and `instruction` columns to better support the new Advanced Prescription UI.
