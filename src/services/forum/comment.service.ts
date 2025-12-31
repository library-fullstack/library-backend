import connection from "../../config/db";
import type {
  ForumComment,
  ForumCommentDetail,
  CreateCommentInput,
  UpdateCommentInput,
} from "../../models/forum/comment.model";
import ForumPostService from "./post.service";

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

const ForumCommentService = {
  async getCommentsByPostId(
    postId: number,
    page: number = 1,
    limit: number = 20,
    userId?: string
  ): Promise<{ comments: ForumCommentDetail[]; total: number }> {
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        fc.id,
        fc.post_id,
        fc.user_id,
        fc.parent_id,
        fc.content,
        fc.status,
        fc.created_at,
        fc.updated_at,
        u.full_name AS author_name,
        u.avatar_url,
        COALESCE(fc.likes_count, 0) AS likes_count,
        CASE WHEN COALESCE(fc.likes_count, 0) > 0 THEN 1 ELSE 0 END AS is_liked
      FROM forum_comments fc
      LEFT JOIN users u ON fc.user_id = u.id
      WHERE fc.post_id = ? AND fc.status != 'DELETED' AND fc.parent_id IS NULL
      ORDER BY fc.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [results] = await connection.query(query, [postId, limit, offset]);

    const countQuery = `
      SELECT COUNT(*) as total FROM forum_comments
      WHERE post_id = ? AND status != 'DELETED' AND parent_id IS NULL
    `;
    const [countResult] = await connection.query(countQuery, [postId]);

    const total = (countResult as any[])[0]?.total || 0;

    const comments = (results as any[]).map((comment) => ({
      ...comment,
      created_at: convertToISO(comment.created_at),
      updated_at: convertToISO(comment.updated_at),
      author: {
        id: comment.user_id,
        full_name: comment.author_name,
        avatar_url: comment.avatar_url,
      },
    })) as ForumCommentDetail[];

    return { comments, total };
  },

  async getRepliesByParentId(
    parentId: number,
    userId?: string
  ): Promise<ForumCommentDetail[]> {
    const query = `
      SELECT
        fc.id,
        fc.post_id,
        fc.user_id,
        fc.parent_id,
        fc.content,
        fc.status,
        fc.created_at,
        fc.updated_at,
        u.full_name AS author_name,
        u.avatar_url,
        COALESCE(fc.likes_count, 0) AS likes_count,
        CASE WHEN COALESCE(fc.likes_count, 0) > 0 THEN 1 ELSE 0 END AS is_liked
      FROM forum_comments fc
      LEFT JOIN users u ON fc.user_id = u.id
      WHERE fc.parent_id = ? AND fc.status != 'DELETED'
      ORDER BY fc.created_at ASC
    `;

    const [results] = await connection.query(query, [parentId]);

    return (results as any[]).map((comment) => ({
      ...comment,
      created_at: convertToISO(comment.created_at),
      updated_at: convertToISO(comment.updated_at),
      author: {
        id: comment.user_id,
        full_name: comment.author_name,
        avatar_url: comment.avatar_url,
      },
    })) as ForumCommentDetail[];
  },

  async getCommentById(
    commentId: number,
    userId?: string
  ): Promise<ForumCommentDetail | null> {
    const query = `
      SELECT
        fc.id,
        fc.post_id,
        fc.user_id,
        fc.parent_id,
        fc.content,
        fc.status,
        fc.created_at,
        fc.updated_at,
        u.full_name AS author_name,
        u.avatar_url,
        COALESCE(fc.likes_count, 0) AS likes_count,
        CASE WHEN COALESCE(fc.likes_count, 0) > 0 THEN 1 ELSE 0 END AS is_liked
      FROM forum_comments fc
      LEFT JOIN users u ON fc.user_id = u.id
      WHERE fc.id = ?
    `;

    const [results] = await connection.query(query, [commentId]);
    const comment = (results as any[])[0];

    if (!comment) return null;

    return {
      ...comment,
      created_at: convertToISO(comment.created_at),
      updated_at: convertToISO(comment.updated_at),
      author: {
        id: comment.user_id,
        full_name: comment.author_name,
        avatar_url: comment.avatar_url,
      },
    } as ForumCommentDetail;
  },

  async createComment(
    userId: string,
    input: CreateCommentInput
  ): Promise<ForumComment> {
    const { post_id, parent_id = null, content } = input;

    const query = `
      INSERT INTO forum_comments (post_id, user_id, parent_id, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await connection.query(query, [
      post_id,
      userId,
      parent_id,
      content,
    ]);

    const insertResult = result as any;

    if (!insertResult.insertId) {
      throw new Error("Failed to get inserted comment ID");
    }

    try {
      await ForumPostService.updateCommentCount(post_id, 1);
    } catch (error) {
      console.error("Error updating comment count:", error);
    }

    return this.getCommentById(insertResult.insertId) as Promise<ForumComment>;
  },

  async updateComment(
    commentId: number,
    input: UpdateCommentInput
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (input.content !== undefined) {
      fields.push("content = ?");
      values.push(input.content);
    }
    if (input.status !== undefined) {
      fields.push("status = ?");
      values.push(input.status);
    }

    if (!fields.length) return;

    fields.push("updated_at = NOW()");
    values.push(commentId);

    const query = `UPDATE forum_comments SET ${fields.join(", ")} WHERE id = ?`;
    await connection.query(query, values);
  },

  async deleteComment(commentId: number): Promise<void> {
    const comment = await this.getCommentById(commentId);
    if (comment) {
      const query = `UPDATE forum_comments SET status = 'DELETED', content = '[Bình luận đã bị xóa]', updated_at = NOW() WHERE id = ?`;
      await connection.query(query, [commentId]);

      if (comment.post_id) {
        await ForumPostService.updateCommentCount(comment.post_id, -1);
      }
    }
  },

  async hideComment(commentId: number): Promise<void> {
    const query = `UPDATE forum_comments SET status = 'HIDDEN', updated_at = NOW() WHERE id = ?`;
    await connection.query(query, [commentId]);
  },

  async showComment(commentId: number): Promise<void> {
    const query = `UPDATE forum_comments SET status = 'VISIBLE', updated_at = NOW() WHERE id = ?`;
    await connection.query(query, [commentId]);
  },

  async toggleLike(
    commentId: number,
    userId: string
  ): Promise<{ likes_count: number; is_liked: boolean }> {
    try {
      console.log(
        `[toggleLike] Toggling like for commentId: ${commentId}, userId: ${userId}`
      );

      const [commentData] = await connection.query(
        "SELECT likes_count FROM forum_comments WHERE id = ?",
        [commentId]
      );

      if (!Array.isArray(commentData) || commentData.length === 0) {
        throw new Error("Comment not found");
      }

      const currentCount = (commentData[0] as any).likes_count || 0;

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
        "UPDATE forum_comments SET likes_count = ? WHERE id = ?",
        [newCount, commentId]
      );

      console.log(
        `[toggleLike] Updated successfully. New count: ${newCount}, isLiked: ${isLiked}`
      );

      return {
        likes_count: newCount,
        is_liked: isLiked,
      };
    } catch (error) {
      console.error(`[toggleLike] Error:`, error);
      throw error;
    }
  },

  async reportComment(report: {
    commentId: number;
    userId: string;
    reason: string;
  }): Promise<any> {
    const query = `
      INSERT INTO forum_reports (target_type, target_comment_id, reporter_id, reason, status, created_at)
      VALUES ('COMMENT', ?, ?, ?, 'OPEN', NOW())
    `;
    const [result] = await connection.query(query, [
      report.commentId,
      report.userId,
      report.reason,
    ]);

    return result;
  },
};

export default ForumCommentService;
