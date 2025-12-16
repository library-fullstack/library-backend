-- Migration: Add missing columns to forum_categories table

-- Add created_at column if not exists
ALTER TABLE forum_categories ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at column if not exists  
ALTER TABLE forum_categories ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
