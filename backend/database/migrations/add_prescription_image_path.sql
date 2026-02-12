-- Migration: Add image_path column to prescriptions table
-- Date: 2026-02-12
-- Purpose: Store scanned prescription images in history

ALTER TABLE prescriptions 
ADD COLUMN image_path VARCHAR(255) DEFAULT NULL AFTER raw_text;
