import connection from "../config/db.ts";
import { v4 as uuidv4 } from "uuid";
import { sendMail } from "../utils/mailer.ts";
import { generateOtpCode } from "../utils/otp.ts";
import { sendChangePasswordOtpEmail } from "../utils/emailTemplates.ts";

export const verificationService = {
  // gửi hoặc tái sử dụng OTP khi đổi mật khẩu
  async createOrReuseOtp(userId: string, email: string) {
    const [existing] = await connection.query<any[]>(
      `
      SELECT id, code, expires_at
      FROM user_verifications
      WHERE user_id = ? 
        AND vtype = 'CHANGE_PASSWORD'
        AND consumed_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [userId]
    );

    if (existing.length > 0) {
      const { code, expires_at } = existing[0];
      console.log(
        "[OTP] Reusing existing CHANGE_PASSWORD OTP for user:",
        userId
      );
      return { reused: true, code, expires_at };
    }

    const code = generateOtpCode(6);
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    const id = uuidv4();

    await connection.query(
      `
      INSERT INTO user_verifications (id, user_id, vtype, channel, code, expires_at)
      VALUES (?, ?, 'CHANGE_PASSWORD', 'EMAIL', ?, ?)
      `,
      [id, userId, code, expires]
    );

    // gửi mail OTP
    const [users] = await connection.query<any[]>(
      "SELECT full_name FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    const userName = users[0]?.full_name || "bạn";

    await sendChangePasswordOtpEmail(email, userName, code);

    console.log("[OTP] Sent new CHANGE_PASSWORD OTP:", code);
    return { reused: false, code, expires_at: expires };
  },

  // xác minh OTP
  async verifyOtp(userId: string, code: string) {
    const [rows] = await connection.query<any[]>(
      `
      SELECT * FROM user_verifications
      WHERE user_id = ?
        AND vtype = 'CHANGE_PASSWORD'
        AND code = ?
        AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `,
      [userId, code]
    );

    if (!rows.length) throw new Error("Mã OTP không hợp lệ hoặc đã hết hạn.");

    const otp = rows[0];
    if (new Date(otp.expires_at) < new Date()) {
      throw new Error("Mã OTP đã hết hạn, vui lòng gửi lại mã mới.");
    }

    await connection.query(
      `UPDATE user_verifications SET consumed_at = NOW() WHERE id = ?`,
      [otp.id]
    );

    return true;
  },
};
