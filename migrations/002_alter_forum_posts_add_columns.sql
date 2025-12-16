-- Migration: Add is_locked and likes_count columns to forum_posts table

-- Add is_locked column after status (if not already exists)
ALTER TABLE forum_posts ADD COLUMN is_locked TINYINT(1) NOT NULL DEFAULT 0 AFTER status;

-- Add likes_count column after is_locked (if not already exists)
ALTER TABLE forum_posts ADD COLUMN likes_count INT NOT NULL DEFAULT 0 AFTER is_locked;

-- Update likes_count based on existing likes in forum_post_likes table
UPDATE forum_posts p
SET likes_count = (
  SELECT COUNT(*) FROM forum_post_likes fpl WHERE fpl.post_id = p.id
);

-- Add index for performance
ALTER TABLE forum_posts ADD KEY idx_forum_posts_likes (likes_count);
