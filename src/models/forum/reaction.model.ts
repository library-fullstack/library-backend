export interface ForumPostLike {
  id: number;
  post_id: number;
  user_id: string;
  created_at?: Date;
}

export interface ForumCommentLike {
  id: number;
  comment_id: number;
  user_id: string;
  created_at?: Date;
}

export interface LikeResponse {
  success: boolean;
  is_liked: boolean;
  likes_count: number;
}
