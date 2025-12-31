import connection from "../config/db";
import type {
  News,
  NewsWithAuthor,
  CreateNewsInput,
  UpdateNewsInput,
  NewsListFilter,
  NewsStatus,
} from "../models/news.model";

function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}

const NewsService = {
  async getAll(
    filter: NewsListFilter = {}
  ): Promise<{
    data: NewsWithAuthor[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      search,
      author_id,
    } = filter;

    const offset = (page - 1) * limit;
    let whereClause = "1=1";
    const params: any[] = [];

    if (category) {
      whereClause += " AND n.category = ?";
      params.push(category);
    }

    if (status) {
      whereClause += " AND n.status = ?";
      params.push(status);
    }

    if (author_id) {
      whereClause += " AND n.author_id = ?";
      params.push(author_id);
    }

    if (search) {
      whereClause += " AND (n.title LIKE ? OR n.content LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    const query = `
      SELECT 
        n.*,
        u.full_name as author_name,
        u.email as author_email,
        u.avatar_url as author_avatar
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE ${whereClause}
      ORDER BY n.published_at DESC, n.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM news n
      WHERE ${whereClause}
    `;

    const [rows] = await connection.query<NewsWithAuthor[]>(query, [
      ...params,
      limit,
      offset,
    ]);

    const [countRows] = await connection.query<any[]>(countQuery, params);
    const total = countRows[0]?.total || 0;

    return {
      data: rows,
      total,
      page,
      limit,
    };
  },

  async getById(id: number): Promise<NewsWithAuthor | null> {
    const query = `
      SELECT 
        n.*,
        u.full_name as author_name,
        u.email as author_email,
        u.avatar_url as author_avatar
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.id = ?
    `;

    const [rows] = await connection.query<NewsWithAuthor[]>(query, [id]);
    return rows[0] || null;
  },

  async getBySlug(slug: string): Promise<NewsWithAuthor | null> {
    const query = `
      SELECT 
        n.*,
        u.full_name as author_name,
        u.email as author_email,
        u.avatar_url as author_avatar
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.slug = ?
    `;

    const [rows] = await connection.query<NewsWithAuthor[]>(query, [slug]);
    return rows[0] || null;
  },

  async create(input: CreateNewsInput): Promise<News> {
    const slug = generateSlug(input.title);
    const status = input.status || "PUBLISHED";

    const query = `
      INSERT INTO news (title, slug, content, category, status, author_id, thumbnail_url, published_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
    `;

    const [result] = await connection.query(query, [
      input.title,
      slug,
      input.content,
      input.category,
      status,
      input.author_id,
      input.thumbnail_url || null,
    ]);

    const insertResult = result as { insertId: number };
    const news = await this.getById(insertResult.insertId);

    if (!news) {
      throw new Error("Không thể tạo tin tức");
    }

    return news;
  },

  async update(id: number, input: UpdateNewsInput): Promise<News> {
    const fields: string[] = [];
    const values: any[] = [];

    if (input.title !== undefined) {
      fields.push("title = ?");
      values.push(input.title);

      const slug = generateSlug(input.title);
      fields.push("slug = ?");
      values.push(slug);
    }

    if (input.content !== undefined) {
      fields.push("content = ?");
      values.push(input.content);
    }

    if (input.category !== undefined) {
      fields.push("category = ?");
      values.push(input.category);
    }

    if (input.status !== undefined) {
      fields.push("status = ?");
      values.push(input.status);
    }

    if (input.thumbnail_url !== undefined) {
      fields.push("thumbnail_url = ?");
      values.push(input.thumbnail_url);
    }

    if (fields.length === 0) {
      const news = await this.getById(id);
      if (!news) throw new Error("Tin tức không tồn tại");
      return news;
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    const query = `UPDATE news SET ${fields.join(", ")} WHERE id = ?`;
    await connection.query(query, values);

    const news = await this.getById(id);
    if (!news) {
      throw new Error("Không thể cập nhật tin tức");
    }

    return news;
  },

  async delete(id: number): Promise<void> {
    const query = "DELETE FROM news WHERE id = ?";
    await connection.query(query, [id]);
  },

  async updateStatus(id: number, status: NewsStatus): Promise<News> {
    const query = "UPDATE news SET status = ?, updated_at = NOW() WHERE id = ?";
    await connection.query(query, [status, id]);

    const news = await this.getById(id);
    if (!news) {
      throw new Error("Không thể cập nhật trạng thái tin tức");
    }

    return news;
  },

  async getLatestNews(limit: number = 5): Promise<NewsWithAuthor[]> {
    const query = `
      SELECT 
        n.*,
        u.full_name as author_name,
        u.email as author_email,
        u.avatar_url as author_avatar
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.status = 'PUBLISHED'
      ORDER BY n.published_at DESC, n.created_at DESC
      LIMIT ?
    `;

    const [rows] = await connection.query<NewsWithAuthor[]>(query, [limit]);
    return rows;
  },
};

export default NewsService;
