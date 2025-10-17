import nodemailer from "nodemailer";
import { requireEnv } from "../config/env.ts";

const transporter = nodemailer.createTransport({
  host: requireEnv("SMTP_HOST"),
  port: Number(requireEnv("SMTP_PORT") || 587),
  secure: false,
  auth: {
    user: requireEnv("SMTP_USER"),
    pass: requireEnv("SMTP_PASS"),
  },
});

export const sendMail = async (to: string, subject: string, html: string) => {
  const fromEmail = requireEnv("MAILTRAP_FROM_EMAIL");
  const fromName = process.env.MAILTRAP_FROM_NAME || "UNETI Library";

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`MAIL Đã gửi tới ${to} (${info.messageId})`);
  } catch (err: any) {
    console.error("MAIL Gửi mail thất bại:", err.message);
    throw new Error("Không thể gửi email, vui lòng thử lại sau.");
  }
};
