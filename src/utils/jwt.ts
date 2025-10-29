import * as jwt from "jsonwebtoken";
import { requireEnv } from "../config/env.ts";

const jwtLib = jwt.default || jwt;

interface JwtPayload {
  id: string;
  role: string;
  email: string;
}

// tạo token (jwt) với hạn cụ thể + secret trong .env
const signToken = (
  payload: JwtPayload,
  expiresIn: jwt.SignOptions["expiresIn"] = "7d"
): string => {
  return jwtLib.sign(payload, requireEnv("JWT_SECRET"), { expiresIn });
};

// kiểm tra token (jwt)
const verifyToken = (token: string): JwtPayload => {
  try {
    return jwtLib.verify(token, requireEnv("JWT_SECRET")) as JwtPayload;
  } catch {
    throw new Error("Token không hợp lệ hoặc đã hết hạn");
  }
};

export { signToken, verifyToken };
