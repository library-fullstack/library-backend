import { RowDataPacket } from "mysql2";

interface ForumCategory extends RowDataPacket {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  description?: string | null;
  sort_order: number;
  is_locked: boolean;
  allowed_roles?: string; // 'STUDENT,LIBRARIAN,MODERATOR,ADMIN'
  created_at?: Date;
  updated_at?: Date;
}

interface CreateCategoryInput {
  name: string;
  slug: string;
  parent_id?: number | null;
  description?: string;
  sort_order?: number;
  is_locked?: boolean;
  allowed_roles?: string;
}

type UpdateCategoryInput = Partial<CreateCategoryInput>;

interface CategoryResponse {
  success: boolean;
  message: string;
  data?: ForumCategory | ForumCategory[];
}

export {
  ForumCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryResponse,
};
