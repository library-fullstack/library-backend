import connection from "../config/db.ts";
import type {
  Event,
  EventWithCreator,
  CreateEventInput,
  UpdateEventInput,
  EventListFilter,
  EventStatus,
} from "../models/events.model.ts";

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

const EventsService = {
  async getAll(
    filter: EventListFilter = {}
  ): Promise<{
    data: EventWithCreator[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      created_by,
      from_date,
      to_date,
    } = filter;

    const offset = (page - 1) * limit;
    let whereClause = "1=1";
    const params: any[] = [];

    if (status) {
      whereClause += " AND e.status = ?";
      params.push(status);
    }

    if (created_by) {
      whereClause += " AND e.created_by = ?";
      params.push(created_by);
    }

    if (search) {
      whereClause +=
        " AND (e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (from_date) {
      whereClause += " AND e.start_time >= ?";
      params.push(from_date);
    }

    if (to_date) {
      whereClause += " AND e.end_time <= ?";
      params.push(to_date);
    }

    const query = `
      SELECT 
        e.*,
        u.full_name as creator_name,
        u.email as creator_email,
        u.avatar_url as creator_avatar
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE ${whereClause}
      ORDER BY e.start_time DESC, e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM events e
      WHERE ${whereClause}
    `;

    const [rows] = await connection.query<EventWithCreator[]>(query, [
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

  async getById(id: number): Promise<EventWithCreator | null> {
    const query = `
      SELECT 
        e.*,
        u.full_name as creator_name,
        u.email as creator_email,
        u.avatar_url as creator_avatar
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `;

    const [rows] = await connection.query<EventWithCreator[]>(query, [id]);
    return rows[0] || null;
  },

  async getBySlug(slug: string): Promise<EventWithCreator | null> {
    const query = `
      SELECT 
        e.*,
        u.full_name as creator_name,
        u.email as creator_email,
        u.avatar_url as creator_avatar
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.slug = ?
    `;

    const [rows] = await connection.query<EventWithCreator[]>(query, [slug]);
    return rows[0] || null;
  },

  async create(input: CreateEventInput): Promise<Event> {
    const slug = generateSlug(input.title);
    const status = input.status || "UPCOMING";

    const query = `
      INSERT INTO events (title, slug, description, location, start_time, end_time, status, created_by, thumbnail_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await connection.query(query, [
      input.title,
      slug,
      input.description || null,
      input.location || null,
      input.start_time,
      input.end_time,
      status,
      input.created_by,
      input.thumbnail_url || null,
    ]);

    const insertResult = result as { insertId: number };
    const event = await this.getById(insertResult.insertId);

    if (!event) {
      throw new Error("Không thể tạo sự kiện");
    }

    return event;
  },

  async update(id: number, input: UpdateEventInput): Promise<Event> {
    const fields: string[] = [];
    const values: any[] = [];

    if (input.title !== undefined) {
      fields.push("title = ?");
      values.push(input.title);

      const slug = generateSlug(input.title);
      fields.push("slug = ?");
      values.push(slug);
    }

    if (input.description !== undefined) {
      fields.push("description = ?");
      values.push(input.description);
    }

    if (input.location !== undefined) {
      fields.push("location = ?");
      values.push(input.location);
    }

    if (input.start_time !== undefined) {
      fields.push("start_time = ?");
      values.push(input.start_time);
    }

    if (input.end_time !== undefined) {
      fields.push("end_time = ?");
      values.push(input.end_time);
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
      const event = await this.getById(id);
      if (!event) throw new Error("Sự kiện không tồn tại");
      return event;
    }

    fields.push("updated_at = NOW()");
    values.push(id);

    const query = `UPDATE events SET ${fields.join(", ")} WHERE id = ?`;
    await connection.query(query, values);

    const event = await this.getById(id);
    if (!event) {
      throw new Error("Không thể cập nhật sự kiện");
    }

    return event;
  },

  async delete(id: number): Promise<void> {
    const query = "DELETE FROM events WHERE id = ?";
    await connection.query(query, [id]);
  },

  async updateStatus(id: number, status: EventStatus): Promise<Event> {
    const query =
      "UPDATE events SET status = ?, updated_at = NOW() WHERE id = ?";
    await connection.query(query, [status, id]);

    const event = await this.getById(id);
    if (!event) {
      throw new Error("Không thể cập nhật trạng thái sự kiện");
    }

    return event;
  },

  async getUpcomingEvents(limit: number = 5): Promise<EventWithCreator[]> {
    const query = `
      SELECT 
        e.*,
        u.full_name as creator_name,
        u.email as creator_email,
        u.avatar_url as creator_avatar
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.status IN ('UPCOMING', 'ONGOING')
      AND e.start_time >= NOW()
      ORDER BY e.start_time ASC
      LIMIT ?
    `;

    const [rows] = await connection.query<EventWithCreator[]>(query, [limit]);
    return rows;
  },

  async getLatestEvents(limit: number = 5): Promise<EventWithCreator[]> {
    const query = `
      SELECT 
        e.*,
        u.full_name as creator_name,
        u.email as creator_email,
        u.avatar_url as creator_avatar
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.created_at DESC
      LIMIT ?
    `;

    const [rows] = await connection.query<EventWithCreator[]>(query, [limit]);
    return rows;
  },
};

export default EventsService;
