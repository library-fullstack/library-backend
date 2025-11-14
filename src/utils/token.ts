import jwt from "jsonwebtoken";
import crypto from "crypto";
import { requireEnv } from "../config/env.ts";
import connection from "../config/db.ts";
import { v4 as uuidv4 } from "uuid";

const JWT_SECRET = requireEnv("JWT_SECRET");
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

interface RefreshTokenPayload extends TokenPayload {
  tokenVersion: number;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function generateRefreshToken(payload: TokenPayload): string {
  const refreshPayload: RefreshTokenPayload = {
    ...payload,
    tokenVersion: 1,
  };
  return jwt.sign(refreshPayload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      REFRESH_TOKEN_SECRET
    ) as RefreshTokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function storeRefreshToken(
  userId: string,
  refreshToken: string,
  expiresAt: Date
): Promise<string> {
  const tokenId = uuidv4();
  try {
    await connection.query(
      `
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE token_hash = ?, expires_at = ?, updated_at = NOW()
      `,
      [
        tokenId,
        userId,
        hashToken(refreshToken),
        expiresAt,
        hashToken(refreshToken),
        expiresAt,
      ]
    );
    return tokenId;
  } catch (error) {
    console.error("[TokenUtil] Failed to store refresh token:", error);
    throw new Error("Failed to store refresh token");
  }
}

export async function verifyRefreshTokenExists(
  userId: string,
  refreshToken: string
): Promise<boolean> {
  try {
    const [result] = await connection.query<any[]>(
      `
      SELECT id FROM refresh_tokens
      WHERE user_id = ? AND token_hash = ? AND expires_at > NOW() AND revoked = FALSE
      LIMIT 1
      `,
      [userId, hashToken(refreshToken)]
    );
    return result.length > 0;
  } catch (error) {
    console.error("[TokenUtil] Failed to verify refresh token:", error);
    return false;
  }
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  try {
    await connection.query(
      `
      UPDATE refresh_tokens
      SET revoked = TRUE, updated_at = NOW()
      WHERE token_hash = ? LIMIT 1
      `,
      [hashToken(refreshToken)]
    );
  } catch (error) {
    console.error("[TokenUtil] Failed to revoke refresh token:", error);
  }
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  try {
    console.log(`[TokenUtil] Revoking all refresh tokens for user: ${userId}`);
    const [result] = await connection.query(
      `
      UPDATE refresh_tokens
      SET revoked = TRUE, updated_at = NOW()
      WHERE user_id = ?
      `,
      [userId]
    );
    console.log(
      `[TokenUtil] Revoked ${(result as any).affectedRows} refresh tokens for user: ${userId}`
    );
  } catch (error) {
    console.error("[TokenUtil] Failed to revoke all refresh tokens:", error);
  }
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function cleanupExpiredTokens(): Promise<void> {
  try {
    await connection.query(
      `
      DELETE FROM refresh_tokens
      WHERE expires_at < NOW() OR revoked = TRUE
      LIMIT 1000
      `
    );
  } catch (error) {
    console.error("[TokenUtil] Failed to cleanup expired tokens:", error);
  }
}
