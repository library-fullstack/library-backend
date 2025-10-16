import { Request, Response, NextFunction } from "express";
import { env } from "../config/env.ts";
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
    const decoded = jwtLib.verify(token, env.JWT_SECRET);

    (req as any).user = decoded;

    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Phiên đăng nhập đã hết hạn" });
    }
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};
