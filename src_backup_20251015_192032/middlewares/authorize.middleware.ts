import { Request, Response, NextFunction } from "express";

const authorize =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!role)
      return res.status(403).json({ message: "Không có quyền truy cập" });

    if (!allowedRoles.includes(role)) {
      return res
        .status(403)
        .json({ message: "Bạn không đủ quyền để thực hiện thao tác này" });
    }

    next();
  };

const authorizeOrOwner =
  (...allowedRoles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { userId, role } = (req as any).user;
    const targetId = req.params.userId;

    if (allowedRoles.includes(role)) return next();

    // cho phép user xem những thứ thuộc về user
    if (targetId && userId === targetId) return next();

    return res
      .status(403)
      .json({ message: "Không đủ quyền truy cập tài nguyên này" });
  };

export { authorize, authorizeOrOwner };
