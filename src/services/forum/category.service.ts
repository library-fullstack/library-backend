import connection from "../../config/db";
import { v4 as uuidv4 } from "uuid";
import type {
  ForumCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../../models/forum/category.model";

const ForumCategoryService = {
  async getAllCategories(): Promise<ForumCategory[]> {
    const query = `
      SELECT id, name, slug, parent_id, description, sort_order, is_locked, allowed_roles, created_at, updated_at
      FROM forum_categories
      WHERE parent_id IS NULL
      ORDER BY sort_order ASC, name ASC
    `;
    const [results] = await connection.query(query);
    return (Array.isArray(results) ? results : []) as ForumCategory[];
  },

  async getCategoryWithChildren(
    categoryId: number
  ): Promise<ForumCategory | null> {
    const query = `
      SELECT id, name, slug, parent_id, description, sort_order, is_locked, allowed_roles, created_at, updated_at
      FROM forum_categories
      WHERE id = ?
    `;
    const [results] = await connection.query(query, [categoryId]);
    return (Array.isArray(results) ? results[0] : null) as ForumCategory | null;
  },

  async getCategoryBySlug(slug: string): Promise<ForumCategory | null> {
    const query = `
      SELECT id, name, slug, parent_id, description, sort_order, is_locked, allowed_roles, created_at, updated_at
      FROM forum_categories
      WHERE slug = ?
    `;
    const [results] = await connection.query(query, [slug]);
    return (Array.isArray(results) ? results[0] : null) as ForumCategory | null;
  },

  async createCategory(input: CreateCategoryInput): Promise<ForumCategory> {
    const {
      name,
      slug,
      parent_id = null,
      description = null,
      sort_order = 0,
      is_locked = false,
      allowed_roles = "STUDENT,LIBRARIAN,MODERATOR,ADMIN",
    } = input;

    const query = `
      INSERT INTO forum_categories (name, slug, parent_id, description, sort_order, is_locked, allowed_roles, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await connection.query(query, [
      name,
      slug,
      parent_id,
      description,
      sort_order,
      is_locked ? 1 : 0,
      allowed_roles,
    ]);

    const insertResult = result as any;
    return this.getCategoryWithChildren(
      insertResult.insertId
    ) as Promise<ForumCategory>;
  },

  async updateCategory(
    categoryId: number,
    input: UpdateCategoryInput
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      fields.push("name = ?");
      values.push(input.name);
    }
    if (input.slug !== undefined) {
      fields.push("slug = ?");
      values.push(input.slug);
    }
    if (input.description !== undefined) {
      fields.push("description = ?");
      values.push(input.description);
    }
    if (input.sort_order !== undefined) {
      fields.push("sort_order = ?");
      values.push(input.sort_order);
    }
    if (input.is_locked !== undefined) {
      fields.push("is_locked = ?");
      values.push(input.is_locked ? 1 : 0);
    }
    if (input.allowed_roles !== undefined) {
      fields.push("allowed_roles = ?");
      values.push(input.allowed_roles);
    }

    if (!fields.length) return;

    fields.push("updated_at = NOW()");
    values.push(categoryId);

    const query = `UPDATE forum_categories SET ${fields.join(", ")} WHERE id = ?`;
    await connection.query(query, values);
  },

  async deleteCategory(categoryId: number): Promise<void> {
    const query = `DELETE FROM forum_categories WHERE id = ? AND parent_id IS NULL`;
    await connection.execute(query, [categoryId]);
  },

  async lockCategory(categoryId: number): Promise<void> {
    const query = `UPDATE forum_categories SET is_locked = 1, updated_at = NOW() WHERE id = ?`;
    await connection.execute(query, [categoryId]);
  },

  async unlockCategory(categoryId: number): Promise<void> {
    const query = `UPDATE forum_categories SET is_locked = 0, updated_at = NOW() WHERE id = ?`;
    await connection.execute(query, [categoryId]);
  },
};

export default ForumCategoryService;
