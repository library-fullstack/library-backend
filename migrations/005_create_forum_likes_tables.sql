CREATE TABLE forum_post_likes (
  post_id INT NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  CONSTRAINT fk_fpl_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_fpl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE forum_comment_likes (
  comment_id INT NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (comment_id, user_id),
  CONSTRAINT fk_fcl_comment FOREIGN KEY (comment_id) REFERENCES forum_comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_fcl_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;