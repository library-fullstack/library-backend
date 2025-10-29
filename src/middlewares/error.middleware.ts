import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("[Error Middleware] Caught error:");
  console.error("Route:", req.method, req.originalUrl);
  console.error("Name:", err?.name);
  console.error("Message:", err?.message);
  console.error("Stack:", err?.stack || "(no stack)");
  console.error("Raw error object:", JSON.stringify(err, null, 2));

  const status = err.status || 500;
  const message = err.message || "Lỗi hệ thống";

  res.status(status).json({
    message,
    stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
  });
};
