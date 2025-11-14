import { Request, Response, NextFunction } from "express";
import type { ApiError } from "../types/errors.ts";

export const errorMiddleware = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = err as ApiError;
  console.error("[Error Middleware] Caught error:");
  console.error("Route:", req.method, req.originalUrl);
  console.error("Name:", error?.name);
  console.error("Message:", error?.message);
  console.error("Stack:", error?.stack || "(no stack)");
  console.error("Raw error object:", JSON.stringify(error, null, 2));

  // Prevent sending response multiple times
  if (res.headersSent) {
    console.error("Headers already sent, cannot send error response");
    return next(error);
  }

  const status = error?.status || error?.statusCode || 500;
  const message = error?.message || "Lỗi hệ thống";

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV !== "production" ? error?.stack : undefined,
  });
};
