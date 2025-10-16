import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

const authorize =
  (...allowedRoles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Chưa đăng nhập hoặc token không hợp lệ" });
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return res
        .status(403)
        .json({ message: "Bạn không đủ quyền để thực hiện thao tác này" });
    }

    next();
  };

const authorizeOrOwner =
  (...allowedRoles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Chưa đăng nhập hoặc token không hợp lệ" });
    }

    const { userId, role } = req.user;
    const targetId = req.params.userId || req.params.user_id;

    // có quyền cao hơn thì bỏ qua
    if (allowedRoles.includes(role)) return next();

    // là chính chủ thì bỏ qua
    if (targetId && userId === targetId) return next();

    return res
      .status(403)
      .json({ message: "Không đủ quyền truy cập tài nguyên này" });
  };

export { authorize, authorizeOrOwner };
