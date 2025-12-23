import connection from "../../config/db.ts";
import path from "path";
import fs from "fs";

function convertToISO(mysqlDateTime: any): string {
  if (!mysqlDateTime) return new Date().toISOString();

  if (!(mysqlDateTime instanceof Date)) {
    if (typeof mysqlDateTime === "string") {
      const [date, time] = mysqlDateTime.split(" ");
      return `${date}T${time}`;
    }
    return new Date().toISOString();
  }
  const vietnamDate = new Date(mysqlDateTime.getTime() + 7 * 60 * 60 * 1000);

  const year = vietnamDate.getUTCFullYear();
  const month = String(vietnamDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(vietnamDate.getUTCDate()).padStart(2, "0");
  const hours = String(vietnamDate.getUTCHours()).padStart(2, "0");
  const minutes = String(vietnamDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(vietnamDate.getUTCSeconds()).padStart(2, "0");

  const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  console.log(
    `[convertToISO] Input: ${mysqlDateTime.toISOString()} -> Output: ${result}`
  );
  return result;
}

interface CreatePostInput {
  title: string;
  content: string;
  categoryId: number;
  userId: string;
  status?: string;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  files?: Array<{
    url: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
  }>;
}

interface UpdatePostInput {
  title?: string;
  content?: string;
  categoryId?: number;
}

interface GetPostsFilter {
  page: number;
  limit: number;
  categoryId?: number;
  sortBy?: string;
  search?: string;
  status?: string;
  userId?: string;
  includeUserPending?: boolean;
}

interface PostResponse {
  id: number;
  title: string;
  content: string;
  categoryId: number;
  userId: string;
  status: string;
  pinned: boolean;
  is_locked: boolean;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  userName?: string;
  userAvatar?: string;
  userRole?: string;
  is_liked?: boolean;
  category_name?: string;
  category_slug?: string;
  attachments?: Array<{
    id: number;
    file_url: string;
    file_name: string;
    original_name: string;
    file_type: string;
    file_size: number;
  }>;
}
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}
function mapRowToPost(row: any): PostResponse {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    categoryId: row.category_id,
    userId: row.user_id,
    status: row.status,
    pinned: Boolean(row.pinned),
    is_locked: Boolean(row.is_locked),
    likes_count: row.likes_count || 0,
    comments_count: row.comments_count || 0,
    views_count: row.views_count || 0,
    created_at: convertToISO(row.created_at),
    updated_at: convertToISO(row.updated_at),
    userName: row.userName,
    userAvatar: row.userAvatar,
    userRole: row.role,
    is_liked: Boolean(row.is_liked),
    category_name: row.category_name,
    category_slug: row.category_slug,
  };
}

const ForumPostService = {
  async createPost(input: CreatePostInput): Promise<PostResponse> {
    const slug = generateSlug(input.title);
    const query = `
      INSERT INTO forum_posts (title, slug, content, category_id, user_id, status, approved_by, approved_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const [result] = await connection.query(query, [
      input.title,
      slug,
      input.content,
      input.categoryId,
      input.userId,
      (input.status || "PENDING").toUpperCase(),
      input.approvedBy || null,
      input.approvedAt || null,
    ]);

    const insertResult = result as { insertId: number };
    const postId = insertResult.insertId;

    if (input.files && input.files.length > 0) {
      const attachmentQuery = `
        INSERT INTO forum_post_attachments (post_id, file_url, file_name, original_name, file_type, file_size, uploaded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      for (const file of input.files) {
        await connection.query(attachmentQuery, [
          postId,
          file.url,
          file.filename,
          file.originalName,
          file.mimeType,
          file.size,
          input.userId,
        ]);
        console.log(
          `[ForumPostService.createPost] Saved attachment: ${file.url}`
        );
      }
    }

    return this.getPostById(postId) as Promise<PostResponse>;
  },

  async getPosts(
    filter: GetPostsFilter
  ): Promise<{ data: PostResponse[]; total: number }> {
    let whereClause = "1=1";
    const params: any[] = [];

    if (filter.categoryId) {
      whereClause += " AND p.category_id = ?";
      params.push(filter.categoryId);
    }

    if (filter.status) {
      if (filter.includeUserPending && filter.userId) {
        whereClause +=
          " AND (p.status = ? OR (p.user_id = ? AND p.status IN ('PENDING', 'REJECTED')))";
        params.push(filter.status, filter.userId);
      } else {
        whereClause += " AND p.status = ?";
        params.push(filter.status);
      }
    }

    console.log(
      "ForumPostService.getPosts - whereClause:",
      whereClause,
      "params:",
      params
    );

    if (filter.search) {
      whereClause += " AND (p.title LIKE ? OR p.content LIKE ?)";
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm);
    }

    const countQuery = `
      SELECT COUNT(*) as total FROM forum_posts p
      WHERE ${whereClause}
    `;
    const [countResult] = await connection.query(countQuery, params);
    const total = Array.isArray(countResult)
      ? (countResult[0] as { total: number }).total
      : 0;

    let orderBy = "p.created_at DESC";
    if (filter.sortBy === "trending") {
      orderBy =
        "(p.likes_count + p.comments_count * 2) DESC, p.created_at DESC";
    } else if (filter.sortBy === "most-comments") {
      orderBy = "p.comments_count DESC";
    } else if (filter.sortBy === "oldest") {
      orderBy = "p.created_at ASC";
    }

    const offset = (filter.page - 1) * filter.limit;

    const dataParams: any[] = [];
    dataParams.push(...params);
    dataParams.push(filter.limit, offset);

    const dataQuery = `
      SELECT 
        p.id, p.title, p.slug, p.content, p.category_id, p.user_id, 
        p.status, p.pinned, p.is_locked, p.likes_count, 
        p.comments_count, p.views_count, p.created_at, p.updated_at,
        COALESCE(u.full_name, 'Unknown') as userName, 
        u.avatar_url as userAvatar, u.role,
        c.name as category_name, c.slug as category_slug,
        CASE WHEN COALESCE(p.likes_count, 0) > 0 THEN 1 ELSE 0 END as is_liked
      FROM forum_posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN forum_categories c ON p.category_id = c.id
      WHERE ${whereClause}
      ORDER BY p.pinned DESC, ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const [data] = await connection.query(dataQuery, dataParams);

    console.log(
      "ForumPostService.getPosts - data returned:",
      (data as any[])?.length,
      "rows"
    );

    return {
      data: (Array.isArray(data) ? data : []).map(mapRowToPost),
      total,
    };
  },

  async getPostById(
    postId: number,
    userId?: string
  ): Promise<PostResponse | null> {
    console.log(`[getPostById] START: postId=${postId}, userId=${userId}`);
    const query = `
      SELECT 
        p.id, p.title, p.content, p.category_id, p.user_id, 
        p.status, p.pinned, p.is_locked, p.likes_count, 
        p.comments_count, p.views_count, p.created_at, p.updated_at,
        COALESCE(u.full_name, 'Unknown') as userName, 
        u.avatar_url as userAvatar, u.role,
        c.name as category_name, c.slug as category_slug,
        CASE WHEN COALESCE(p.likes_count, 0) > 0 THEN 1 ELSE 0 END as is_liked
      FROM forum_posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN forum_categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    const params = [postId];
    console.log(`[getPostById] Query params:`, params);
    const [result] = await connection.query(query, params);
    const data = Array.isArray(result) && result.length > 0 ? result[0] : null;

    if (!data) {
      console.log(`[getPostById] Post not found for postId: ${postId}`);
      return null;
    }

    console.log(`[getPostById] Raw data from DB:`, data);
    const post = mapRowToPost(data);
    console.log(`[getPostById] Mapped post:`, {
      id: post.id,
      is_liked: post.is_liked,
      likes_count: post.likes_count,
    });

    const attachmentQuery = `
      SELECT id, file_url, file_name, original_name, file_type, file_size
      FROM forum_post_attachments
      WHERE post_id = ?
      ORDER BY created_at ASC
    `;
    const [attachments] = await connection.query(attachmentQuery, [postId]);
    post.attachments = Array.isArray(attachments)
      ? (attachments as Array<{
          id: number;
          file_url: string;
          file_name: string;
          original_name: string;
          file_type: string;
          file_size: number;
        }>)
      : [];

    await connection.query(
      "UPDATE forum_posts SET views_count = views_count + 1 WHERE id = ?",
      [postId]
    );

    console.log(
      `[getPostById] END: returning post with is_liked=${post.is_liked}`
    );
    return post;
  },

  async updatePost(
    postId: number,
    input: UpdatePostInput
  ): Promise<PostResponse | null> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.title !== undefined) {
      updates.push("title = ?");
      values.push(input.title);
    }
    if (input.content !== undefined) {
      updates.push("content = ?");
      values.push(input.content);
    }
    if (input.categoryId !== undefined) {
      updates.push("category_id = ?");
      values.push(input.categoryId);
    }

    updates.push("updated_at = NOW()");
    values.push(postId);

    const query = `UPDATE forum_posts SET ${updates.join(", ")} WHERE id = ?`;
    await connection.query(query, values);

    return this.getPostById(postId);
  },

  async deletePost(postId: number): Promise<void> {
    await connection.query(
      "DELETE FROM forum_post_attachments WHERE post_id = ?",
      [postId]
    );
    await connection.query(
      "DELETE FROM forum_reports WHERE target_post_id = ?",
      [postId]
    );
    await connection
      .query("DELETE FROM forum_post_likes WHERE post_id = ?", [postId])
      .catch(() => {});
    await connection.query("DELETE FROM forum_comments WHERE post_id = ?", [
      postId,
    ]);
    await connection.query("DELETE FROM forum_posts WHERE id = ?", [postId]);
  },

  async toggleLike(postId: number, userId: string): Promise<boolean> {
    try {
      console.log(
        `[toggleLike] Toggling like for postId: ${postId}, userId: ${userId}`
      );

      const [postData] = await connection.query(
        "SELECT likes_count FROM forum_posts WHERE id = ?",
        [postId]
      );

      if (!Array.isArray(postData) || postData.length === 0) {
        throw new Error("Post not found");
      }

      const currentCount = (postData[0] as any).likes_count || 0;

      let newCount: number;
      let isLiked: boolean;

      if (currentCount > 0) {
        newCount = Math.max(0, currentCount - 1);
        isLiked = false;
      } else {
        newCount = currentCount + 1;
        isLiked = true;
      }

      await connection.query(
        "UPDATE forum_posts SET likes_count = ? WHERE id = ?",
        [newCount, postId]
      );

      console.log(
        `[toggleLike] Updated successfully. New count: ${newCount}, isLiked: ${isLiked}`
      );
      return isLiked;
    } catch (error) {
      console.error(`[toggleLike] Error:`, error);
      throw error;
    }
  },

  async reportPost(report: {
    postId: number;
    userId: string;
    reason: string;
    description: string;
  }): Promise<any> {
    const query = `
      INSERT INTO forum_reports (target_type, target_post_id, reporter_id, reason, status, created_at)
      VALUES ('POST', ?, ?, ?, 'OPEN', NOW())
    `;
    const [result] = await connection.query(query, [
      report.postId,
      report.userId,
      report.reason,
    ]);

    return result;
  },

  async updateCommentCount(postId: number, increment: number) {
    const query = `
      UPDATE forum_posts
      SET comments_count = GREATEST(0, comments_count + ?)
      WHERE id = ?
    `;
    const [result] = await connection.query(query, [increment, postId]);
    return result;
  },

  async getById(postId: number) {
    const query = `
      SELECT p.*, u.full_name, u.avatar_url
      FROM forum_posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;
    const [result] = await connection.query(query, [postId]);
    const post = Array.isArray(result) ? result[0] : null;
    return post;
  },
};

export default ForumPostService;
