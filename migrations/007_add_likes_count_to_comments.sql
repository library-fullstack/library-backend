-- Migration: Add likes_count column to forum_comments table
-- Since we removed forum_comment_likes table, we need likes_count denormalized column

ALTER TABLE forum_comments 
ADD COLUMN likes_count INT DEFAULT 0 NOT NULL;

-- Verify
SELECT 'forum_comments.likes_count column added' as status;
