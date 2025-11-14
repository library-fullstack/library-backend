import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.ts";
import { verifyAccessToken } from "../utils/token.ts";
import * as jwt from "jsonwebtoken";

const jwtLib = jwt.default || jwt;

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Thiếu token" });
  }

  const token = header.split(" ")[1];

  try {
    // Use new token verification with refresh support
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      // Token invalid or expired
      // Client should catch 401 and call /auth/refresh to get new token
      return res.status(401).json({
        message: "Token hết hạn hoặc không hợp lệ",
        code: "TOKEN_EXPIRED",
      });
    }

    (req as any).user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err: any) {
    console.error("[AuthMiddleware] Error:", err);
    res.status(401).json({
      message: "Token không hợp lệ",
      code: "INVALID_TOKEN",
    });
  }
};
