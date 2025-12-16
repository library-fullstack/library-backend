export interface ForumComment {
  id: number;
  post_id: number;
  user_id?: string | null;
  parent_id?: number | null;
  content: string;
  status: "VISIBLE" | "HIDDEN" | "DELETED";
  created_at?: Date;
  updated_at?: Date;
}

export interface ForumAuthor {
  id: string;
  full_name: string;
  avatar_url?: string;
  email: string;
}

export interface ForumCommentDetail extends ForumComment {
  author?: ForumAuthor;
  likes_count?: number;
  is_liked?: boolean;
  replies?: ForumCommentDetail[];
}

export interface CreateCommentInput {
  post_id: number;
  parent_id?: number | null;
  content: string;
}

export interface UpdateCommentInput {
  content?: string;
  status?: "VISIBLE" | "HIDDEN" | "DELETED";
}
