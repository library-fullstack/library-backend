CREATE TABLE IF NOT EXISTS forum_post_attachments (
  id INT NOT NULL AUTO_INCREMENT,
  post_id INT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  uploaded_by CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_fpa_post (post_id),
  KEY idx_fpa_user (uploaded_by),
  CONSTRAINT fk_fpa_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_fpa_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
