import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Yêu cầu quyền: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

/**
 * Allow owner or moderator/admin
 * Compare resource owner with current user
 */
export const requireOwnerOrModerator =
  (ownerIdExtractor?: (req: Request) => string | undefined) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
      });
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    if (["ADMIN", "MODERATOR"].includes(userRole)) {
      return next();
    }

    let ownerId: string | undefined;
    if (ownerIdExtractor) {
      ownerId = ownerIdExtractor(req);
    } else {
      ownerId =
        (req.body as any)?.user_id ||
        (req.params as any)?.user_id ||
        (req.body as any)?.userId;
    }

    if (ownerId && userId === ownerId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền sửa/xoá bài viết này",
    });
  };

/**
 * Only allow ADMIN
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Chưa đăng nhập",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Chỉ ADMIN có thể thực hiện hành động này",
    });
  }

  next();
};

/**
 * Only allow MODERATOR or ADMIN
 */
export const requireModerator = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Chưa đăng nhập",
    });
  }

  if (!["ADMIN", "MODERATOR"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Chỉ MODERATOR hoặc ADMIN có thể thực hiện hành động này",
    });
  }

  next();
};
