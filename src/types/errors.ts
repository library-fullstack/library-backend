import type { NextFunction, Request, Response } from "express";

export interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  message: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
    [key: string]: unknown;
  };
  cloudinaryUpload?: Record<string, unknown>;
}

export function isApiError(error: unknown): error is ApiError {
  return (
    error instanceof Error &&
    (typeof (error as ApiError).status === "number" ||
      typeof (error as ApiError).statusCode === "number")
  );
}

export function createAsyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
