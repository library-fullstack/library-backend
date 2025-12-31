import type { Response } from "express";
import type { AuthRequest } from "../../types/errors";
import connection from "../../config/db";
export const getMyPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const query = `
      SELECT 
        id, title, status, created_at, rejection_reason
      FROM forum_posts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    const [rows] = await connection.execute(query, [userId]);

    res.status(200).json({
      success: true,
      message: "My posts retrieved successfully",
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching my posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch my posts",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
