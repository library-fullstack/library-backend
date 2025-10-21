import * as jwt from "jsonwebtoken";
import { requireEnv } from "../config/env.ts";

// tạo token (jwt) với hạn cụ thể + secret trong .env
const signToken = (
  payload: string | object | Buffer,
  expiresIn: jwt.SignOptions["expiresIn"] = "7d"
): string => jwt.default.sign(payload, requireEnv("JWT_SECRET"), { expiresIn });

// kiểm tra token (jwt)
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, requireEnv("JWT_SECRET"));
  } catch (err) {
    throw new Error("Token không hợp lệ hoặc đã hết hạn");
  }
};

export { signToken, verifyToken };
