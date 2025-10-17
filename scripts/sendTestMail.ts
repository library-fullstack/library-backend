import { sendMail } from "../src/utils/mailer.ts";

await sendMail(
  "test@example.com",
  "Thử gửi mail Mailtrap Sandbox",
  "<p>Xin chào, đây là email test từ <b>UNETI Library</b>.</p>"
);
