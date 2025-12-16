CREATE TABLE IF NOT EXISTS forum_categories (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  parent_id INT DEFAULT NULL,
  description VARCHAR(255) DEFAULT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_forum_cat_slug (slug),
  UNIQUE KEY uk_forum_cat_name_parent (name, parent_id),
  KEY idx_forum_cat_parent (parent_id),
  CONSTRAINT fk_forum_cat_parent FOREIGN KEY (parent_id) REFERENCES forum_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS forum_posts (
  id INT NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) DEFAULT NULL,
  category_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL,
  content LONGTEXT NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED','LOCKED','DELETED') NOT NULL DEFAULT 'PENDING',
  pinned TINYINT(1) NOT NULL DEFAULT 0,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  likes_count INT NOT NULL DEFAULT 0,
  views_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,

  approved_by CHAR(36) DEFAULT NULL,
  approved_at DATETIME DEFAULT NULL,
  locked_by CHAR(36) DEFAULT NULL,
  locked_at DATETIME DEFAULT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uk_forum_post_slug (slug),
  FULLTEXT KEY ftx_forum_posts (title, content),
  KEY idx_forum_posts_cat (category_id),
  KEY idx_forum_posts_status (status),
  KEY idx_forum_posts_user (user_id),
  KEY idx_forum_posts_created (created_at),

  CONSTRAINT fk_forum_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_forum_posts_cat FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE,
  CONSTRAINT fk_forum_posts_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_forum_posts_locked_by FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS forum_comments (
  id INT NOT NULL AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id CHAR(36) DEFAULT NULL,
  parent_id INT DEFAULT NULL,
  content TEXT NOT NULL,
  status ENUM('VISIBLE','HIDDEN','DELETED') NOT NULL DEFAULT 'VISIBLE',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_fcm_post (post_id),
  KEY idx_fcm_parent (parent_id),
  KEY idx_fcm_user (user_id),
  CONSTRAINT fk_fcm_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_fcm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_fcm_parent FOREIGN KEY (parent_id) REFERENCES forum_comments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS forum_post_likes (
  post_id INT NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  CONSTRAINT fk_fpl_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_fpl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS forum_comment_likes (
  comment_id INT NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, user_id),
  CONSTRAINT fk_fcl_comment FOREIGN KEY (comment_id) REFERENCES forum_comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_fcl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS forum_reports (
  id INT NOT NULL AUTO_INCREMENT,
  target_type ENUM('POST','COMMENT') NOT NULL,
  target_post_id INT DEFAULT NULL,
  target_comment_id INT DEFAULT NULL,
  reporter_id CHAR(36) NOT NULL,
  reason VARCHAR(200) NOT NULL,
  status ENUM('OPEN','REVIEWING','RESOLVED','DISMISSED') NOT NULL DEFAULT 'OPEN',
  handled_by CHAR(36) DEFAULT NULL,
  resolution_note VARCHAR(255) DEFAULT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_fr_target_post (target_post_id),
  KEY idx_fr_target_comment (target_comment_id),
  KEY idx_fr_status (status),

  CONSTRAINT fk_fr_post FOREIGN KEY (target_post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_fr_comment FOREIGN KEY (target_comment_id) REFERENCES forum_comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_fr_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fr_handled_by FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_fr_target CHECK (
    (target_type='POST' AND target_post_id IS NOT NULL AND target_comment_id IS NULL) OR
    (target_type='COMMENT' AND target_comment_id IS NOT NULL AND target_post_id IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_notifications (
  id INT NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) NOT NULL,
  ntype ENUM('REPLY','MENTION','MODERATION','SYSTEM') NOT NULL,
  payload JSON NOT NULL,
  read_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_un_user_read (user_id, read_at),
  CONSTRAINT fk_un_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) DEFAULT NULL,
  type ENUM('SYSTEM','FORUM','BOOK','BORROW','USER','ORDER','OTHER') NOT NULL,
  action VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) DEFAULT NULL,
  target_id VARCHAR(50) DEFAULT NULL,
  description TEXT DEFAULT NULL,
  ip_address VARCHAR(100) DEFAULT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_act_user (user_id),
  KEY idx_act_type (type),
  CONSTRAINT fk_act_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS file_uploads (
  id CHAR(36) NOT NULL,
  uploader_id CHAR(36) NOT NULL,
  file_url VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) DEFAULT NULL,
  related_type VARCHAR(50) DEFAULT NULL,
  related_id VARCHAR(50) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_fu_user (uploader_id),
  KEY idx_fu_related (related_type, related_id),
  CONSTRAINT fk_fu_user FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS allow_student_info_edit BOOLEAN DEFAULT TRUE;
