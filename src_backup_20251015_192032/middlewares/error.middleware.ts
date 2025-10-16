import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("[Error Middleware]", err);

  const status = err.status || 500;
  const message = err.message || "Lỗi hệ thống";

  res.status(status).json({ message });
};
