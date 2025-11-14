import connection from "../config/db.ts";
import { bannerModel } from "../models/index.ts";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "../config/cloudinary.ts";

const getAllBanners = async (
  page: number = 1,
  limit: number = 50,
  isActive?: boolean
): Promise<{ banners: bannerModel.Banner[]; total: number }> => {
  try {
    let query = "SELECT * FROM banners WHERE 1=1";
    const params: any[] = [];

    if (isActive !== undefined) {
      query += " AND is_active = ?";
      params.push(isActive);
    }

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, (page - 1) * limit);

    const [rows] = await connection.query<bannerModel.Banner[]>(query, params);

    let countQuery = "SELECT COUNT(*) as total FROM banners WHERE 1=1";
    const countParams: any[] = [];
    if (isActive !== undefined) {
      countQuery += " AND is_active = ?";
      countParams.push(isActive);
    }

    const [countResult] = await connection.query<any[]>(
      countQuery,
      countParams
    );
    const total = countResult[0].total;

    return { banners: rows, total };
  } catch (error) {
    console.error("[getAllBanners] Error:", error);
    throw error;
  }
};

const getBannerById = async (
  id: string
): Promise<bannerModel.Banner | null> => {
  try {
    const [rows] = await connection.query<bannerModel.Banner[]>(
      "SELECT * FROM banners WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("[getBannerById] Error:", error);
    throw error;
  }
};

const getActiveBanner = async (): Promise<bannerModel.Banner | null> => {
  try {
    const now = new Date();
    const [rows] = await connection.query<bannerModel.Banner[]>(
      `SELECT * FROM banners 
       WHERE is_active = true 
       AND (start_date IS NULL OR start_date <= ?)
       AND (end_date IS NULL OR end_date >= ?)
       ORDER BY created_at DESC
       LIMIT 1`,
      [now, now]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("[getActiveBanner] Error:", error);
    throw error;
  }
};

const createBanner = async (
  data: bannerModel.CreateBannerInput,
  userId?: string
): Promise<bannerModel.Banner> => {
  try {
    if (!data.image || !data.title || !data.subtitle) {
      throw new Error("Missing required fields: image, title, subtitle");
    }

    const id = uuidv4();
    const now = new Date();

    const [result] = await connection.query(
      `INSERT INTO banners (
        id,
        image,
        overlay,
        title,
        subtitle,
        title_color,
        subtitle_color,
        button_color,
        button_text,
        event_type,
        start_date,
        end_date,
        is_active,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.image,
        data.overlay || "dark",
        data.title,
        data.subtitle,
        data.title_color || "#ffffff",
        data.subtitle_color || "rgba(255,255,255,0.9)",
        data.button_color || "#ED553B",
        data.button_text || "View More",
        data.event_type || "DEFAULT",
        data.start_date || null,
        data.end_date || null,
        data.is_active || false,
        userId || null,
        now,
        now,
      ]
    );

    const banner = await getBannerById(id);
    if (!banner) throw new Error("Failed to retrieve created banner");
    return banner;
  } catch (error) {
    console.error("[createBanner] Error:", error);
    throw error;
  }
};

const updateBanner = async (
  id: string,
  data: bannerModel.UpdateBannerInput,
  userId?: string
): Promise<bannerModel.Banner> => {
  try {
    const existing = await getBannerById(id);
    if (!existing) {
      throw new Error(`Banner with id ${id} not found`);
    }

    const now = new Date();
    const updates: string[] = [];
    const params: any[] = [];

    const fields = [
      "image",
      "overlay",
      "title",
      "subtitle",
      "title_color",
      "subtitle_color",
      "button_color",
      "button_text",
      "event_type",
      "start_date",
      "end_date",
      "is_active",
    ];

    for (const field of fields) {
      const dataKey = field as keyof bannerModel.UpdateBannerInput;
      if (data[dataKey] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[dataKey]);
      }
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push("updated_at = ?");
    params.push(now);

    if (userId) {
      updates.push("updated_by = ?");
      params.push(userId);
    }

    params.push(id);

    await connection.query(
      `UPDATE banners SET ${updates.join(", ")} WHERE id = ?`,
      params
    );

    const updated = await getBannerById(id);
    if (!updated) throw new Error("Failed to retrieve updated banner");
    return updated;
  } catch (error) {
    console.error("[updateBanner] Error:", error);
    throw error;
  }
};

const deleteBanner = async (id: string): Promise<boolean> => {
  try {
    const existing = await getBannerById(id);
    if (!existing) {
      throw new Error(`Banner with id ${id} not found`);
    }

    if (existing.cloudinary_id) {
      try {
        console.log(
          `[deleteBanner] Deleting Cloudinary image: ${existing.cloudinary_id}`
        );
        await cloudinary.uploader.destroy(existing.cloudinary_id);
      } catch (cloudError: any) {
        console.warn(
          `[deleteBanner] Failed to delete Cloudinary image: ${cloudError.message}`
        );
      }
    }

    const [result] = await connection.query(
      "DELETE FROM banners WHERE id = ?",
      [id]
    );

    return (result as any).affectedRows > 0;
  } catch (error) {
    console.error("[deleteBanner] Error:", error);
    throw error;
  }
};

const toggleBannerStatus = async (
  id: string,
  isActive: boolean,
  userId?: string
): Promise<bannerModel.Banner> => {
  try {
    return await updateBanner(id, { is_active: isActive }, userId);
  } catch (error) {
    console.error("[toggleBannerStatus] Error:", error);
    throw error;
  }
};

const deactivateOtherBanners = async (
  bannerId: string,
  userId?: string
): Promise<void> => {
  try {
    const now = new Date();
    let query = "UPDATE banners SET is_active = false, updated_at = ?";
    const params: any[] = [now];

    if (userId) {
      query += ", updated_by = ?";
      params.push(userId);
    }

    query += " WHERE id != ?";
    params.push(bannerId);

    await connection.query(query, params);
  } catch (error) {
    console.error("[deactivateOtherBanners] Error:", error);
    throw error;
  }
};

export default {
  getAllBanners,
  getBannerById,
  getActiveBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  deactivateOtherBanners,
};
