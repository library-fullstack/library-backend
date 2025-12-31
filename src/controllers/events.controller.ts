import { Request, Response } from "express";
import EventsService from "../services/events.service";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import type {
  CreateEventInput,
  UpdateEventInput,
  EventListFilter,
} from "../models/events.model";
import connection from "../config/db";
import { sendEventNotificationEmail } from "../utils/emailTemplates";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const filter: EventListFilter = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      status: req.query.status as any,
      search: req.query.search as string,
      created_by: req.query.created_by as string,
      from_date: req.query.from_date
        ? new Date(req.query.from_date as string)
        : undefined,
      to_date: req.query.to_date
        ? new Date(req.query.to_date as string)
        : undefined,
    };

    const result = await EventsService.getAll(filter);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  } catch (error) {
    console.error("[Events Controller] Get all error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách sự kiện",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const event = await EventsService.getById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sự kiện",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("[Events Controller] Get by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin sự kiện",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getEventBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    const event = await EventsService.getBySlug(slug);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sự kiện",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("[Events Controller] Get by slug error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy thông tin sự kiện",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      location,
      start_time,
      end_time,
      status,
      thumbnail_url,
    } = req.body;
    const created_by = req.userId!;

    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng nhập đầy đủ thông tin (tiêu đề, thời gian bắt đầu, thời gian kết thúc)",
      });
    }

    if (title.length < 5 || title.length > 150) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề phải từ 5-150 ký tự",
      });
    }

    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Thời gian không hợp lệ",
      });
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      });
    }

    const input: CreateEventInput = {
      title: title.trim(),
      description: description?.trim(),
      location: location?.trim(),
      start_time: startTime,
      end_time: endTime,
      status: status || "UPCOMING",
      created_by,
      thumbnail_url,
    };

    const event = await EventsService.create(input);

    const [settings] = await connection.query<any[]>(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'send_event_email' LIMIT 1"
    );

    if (settings.length > 0 && settings[0].setting_value === "true") {
      const [users] = await connection.query<any[]>(
        "SELECT id, email, full_name FROM users WHERE status = 'ACTIVE' AND role IN ('STUDENT', 'STAFF')"
      );

      if (users.length > 0) {
        const eventDate = format(startTime, "dd/MM/yyyy HH:mm", { locale: vi });
        for (const user of users) {
          try {
            await sendEventNotificationEmail(
              user.email,
              input.title,
              input.description || "",
              eventDate
            );
          } catch (err) {
            console.error(`[Events] Email send failed for ${user.email}:`, err);
          }
        }
        console.log(`[Events] Sent notification to ${users.length} recipients`);
      }
    }

    res.status(201).json({
      success: true,
      message: "Tạo sự kiện thành công",
      data: event,
    });
  } catch (error) {
    console.error("[Events Controller] Create error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể tạo sự kiện",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const {
      title,
      description,
      location,
      start_time,
      end_time,
      status,
      thumbnail_url,
    } = req.body;

    if (title !== undefined && (title.length < 5 || title.length > 150)) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề phải từ 5-150 ký tự",
      });
    }

    let startTime: Date | undefined;
    let endTime: Date | undefined;

    if (start_time !== undefined) {
      startTime = new Date(start_time);
      if (isNaN(startTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Thời gian bắt đầu không hợp lệ",
        });
      }
    }

    if (end_time !== undefined) {
      endTime = new Date(end_time);
      if (isNaN(endTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Thời gian kết thúc không hợp lệ",
        });
      }
    }

    if (startTime && endTime && endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: "Thời gian kết thúc phải sau thời gian bắt đầu",
      });
    }

    const input: UpdateEventInput = {
      title: title?.trim(),
      description: description?.trim(),
      location: location?.trim(),
      start_time: startTime,
      end_time: endTime,
      status,
      thumbnail_url,
    };

    const event = await EventsService.update(id, input);

    res.status(200).json({
      success: true,
      message: "Cập nhật sự kiện thành công",
      data: event,
    });
  } catch (error) {
    console.error("[Events Controller] Update error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật sự kiện",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    const event = await EventsService.getById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sự kiện",
      });
    }

    await EventsService.delete(id);

    res.status(200).json({
      success: true,
      message: "Xóa sự kiện thành công",
    });
  } catch (error) {
    console.error("[Events Controller] Delete error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể xóa sự kiện",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getUpcomingEvents = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const events = await EventsService.getUpcomingEvents(limit);

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("[Events Controller] Get upcoming error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy sự kiện sắp tới",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getLatestEvents = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const events = await EventsService.getLatestEvents(limit);

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("[Events Controller] Get latest error:", error);
    res.status(500).json({
      success: false,
      message: "Không thể lấy sự kiện mới nhất",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
