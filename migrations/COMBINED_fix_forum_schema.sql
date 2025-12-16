-- Combined Migration: Fix forum tables schema

-- ============================================
-- Step 1: Add missing columns to forum_posts
-- ============================================
ALTER TABLE forum_posts ADD COLUMN is_locked TINYINT(1) NOT NULL DEFAULT 0 AFTER status;
ALTER TABLE forum_posts ADD COLUMN likes_count INT NOT NULL DEFAULT 0 AFTER is_locked;

-- Update likes_count based on existing data
UPDATE forum_posts p
SET likes_count = (
  SELECT COUNT(*) FROM forum_post_likes fpl WHERE fpl.post_id = p.id
);

ALTER TABLE forum_posts ADD KEY idx_forum_posts_likes (likes_count);

-- ============================================
-- Step 2: Add missing columns to forum_categories
-- ============================================
ALTER TABLE forum_categories ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE forum_categories ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ============================================
-- Step 3: Insert sample categories if table is empty
-- ============================================
INSERT IGNORE INTO forum_categories (id, name, slug, description, sort_order) VALUES
(1, 'Kỹ thuật', 'ky-thuat', 'Thảo luận về các vấn đề kỹ thuật', 1),
(2, 'Tư vấn sách', 'tu-van-sach', 'Tư vấn và gợi ý về sách', 2),
(3, 'Thông báo', 'thong-bao', 'Thông báo chung từ quản trị viên', 3),
(4, 'Đoàn kết', 'doan-ket', 'Kết bạn và tìm kiếm bạn cùng sở thích', 4);
