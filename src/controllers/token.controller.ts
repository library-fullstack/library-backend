import { Request, Response } from "express";
import {
  verifyRefreshToken,
  generateAccessToken,
  verifyRefreshTokenExists,
} from "../utils/token.ts";
import type { ApiError } from "../types/errors.ts";

export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token không tìm thấy. Vui lòng đăng nhập lại.",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      res.clearCookie("refreshToken");
      return res.status(401).json({
        message:
          "Refresh token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
      });
    }

    const tokenExists = await verifyRefreshTokenExists(
      decoded.userId,
      refreshToken
    );

    if (!tokenExists) {
      res.clearCookie("refreshToken");
      return res.status(401).json({
        message: "Refresh token đã bị thu hồi. Vui lòng đăng nhập lại.",
      });
    }

    const newAccessToken = generateAccessToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    return res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    const error = err as ApiError;
    console.error("[RefreshToken]", error);
    res.clearCookie("refreshToken");
    return res.status(401).json({
      message: error.message || "Không thể làm mới token.",
    });
  }
};

export const logoutController = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded) {
        const { revokeRefreshToken } = await import("../utils/token.ts");
        await revokeRefreshToken(refreshToken);
      }
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      message: "Đã đăng xuất thành công.",
    });
  } catch (err) {
    const error = err as ApiError;
    console.error("[Logout]", error);

    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Đã đăng xuất.",
    });
  }
};
