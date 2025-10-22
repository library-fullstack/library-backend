import nodemailer from "nodemailer";
import { requireEnv } from "../config/env.ts";

// transporter
const transporter = nodemailer.createTransport({
  host: requireEnv("SMTP_HOST"),
  port: Number(requireEnv("SMTP_PORT") || 587),
  secure: false,
  auth: {
    user: requireEnv("SMTP_USER"),
    pass: requireEnv("SMTP_PASS"),
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: false,
  logger: false,
});

// kiểm tra kết nối transporter khi khởi động
transporter.verify((error, success) => {
  if (error) {
    console.error("[SMTP] Connection error:", error);
  } else {
    console.log("[SMTP] Server is ready to send emails");
  }
});

// gửi mail với category cho analytics của mailtrap
export const sendMail = async (
  to: string,
  subject: string,
  html: string,
  category?: string
) => {
  const fromEmail = requireEnv("MAILTRAP_FROM_EMAIL");
  const fromName = process.env.MAILTRAP_FROM_NAME || "UNETI Library";

  const mailOptions: any = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
  };

  // thêm category vào header mailtrap
  if (category) {
    mailOptions.headers = {
      "X-Category": category,
    };
  }

  try {
    console.log(`[MAIL] Attempting to send email to: ${to}`);
    console.log(`[MAIL] From: ${fromEmail}`);
    console.log(`[MAIL] Category: ${category || "uncategorized"}`);
    console.log(`[MAIL] SMTP Host: ${requireEnv("SMTP_HOST")}`);

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] ✓ Email sent successfully to ${to}`);
    console.log(`[MAIL] Message ID: ${info.messageId}`);
    console.log(`[MAIL] Response: ${info.response}`);

    return info;
  } catch (err: any) {
    console.error("[MAIL] ✗ Failed to send email:", {
      error: err.message,
      code: err.code,
      command: err.command,
      response: err.response,
      responseCode: err.responseCode,
    });
    throw new Error("Không thể gửi email, vui lòng thử lại sau.");
  }
};
