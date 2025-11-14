import { Request, Response } from "express";
import {
  verifyRefreshToken,
  generateAccessToken,
  verifyRefreshTokenExists,
} from "../utils/token.ts";
import type { ApiError } from "../types/errors.ts";

/**
 * Refresh access token endpoint
 * POST /auth/refresh
 *
 * Client sends refresh token from httpOnly cookie
 * Server validates it and returns new access token
 */
export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token không tìm thấy. Vui lòng đăng nhập lại.",
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      // Clear invalid refresh token
      res.clearCookie("refreshToken");
      return res.status(401).json({
        message:
          "Refresh token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
      });
    }

    // Verify token still exists in database (not revoked)
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

    // Generate new access token
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

/**
 * Logout controller
 * POST /auth/logout
 *
 * Revoke refresh token and clear cookie
 */
export const logoutController = async (req: Request, res: Response) => {
  try {
    // Handle case where req.cookies might be undefined (e.g., when called before login)
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded) {
        // Revoke the refresh token
        const { revokeRefreshToken } = await import("../utils/token.ts");
        await revokeRefreshToken(refreshToken);
      }
    }

    // Clear cookie
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

    // Still clear cookie on error
    res.clearCookie("refreshToken");

    return res.status(200).json({
      message: "Đã đăng xuất.",
    });
  }
};
