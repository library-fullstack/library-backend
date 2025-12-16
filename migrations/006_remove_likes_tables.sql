-- Migration: Remove forum_post_likes and forum_comment_likes tables
-- Keep only likes_count denormalized columns

-- Reset all likes counts to 0
UPDATE forum_posts SET likes_count = 0;
UPDATE forum_comments SET likes_count = 0;

-- Drop likes tables
DROP TABLE IF EXISTS forum_post_likes;
DROP TABLE IF EXISTS forum_comment_likes;

-- Done!
