import * as jwt from "jsonwebtoken";
import { env } from "../config/env.ts";

const signToken = (
  payload: string | object | Buffer,
  expiresIn: jwt.SignOptions["expiresIn"] = "7d"
): string => jwt.default.sign(payload, env.JWT_SECRET, { expiresIn });

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw new Error("Token không hợp lệ hoặc đã hết hạn");
  }
};

export { signToken, verifyToken };
