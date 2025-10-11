import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import db from "../src/config/db.js";

const createAdmin = async () => {
  const id = uuidv4();
  const PEPPER = process.env.PASSWORD_PEPPER || "";
  const hash = await bcrypt.hash("123456" + PEPPER, 10);

  await db.query(
    `
    INSERT INTO users (id, studentId, full_name, email, password, role, status)
    VALUES (?, NULL, ?, ?, ?, 'ADMIN', 'ACTIVE')
    `,
    [id, "Nguyễn Văn A", "123456", hash]
  );

  console.log("Đã tạo thành công tài khoản Admin:");
  console.log({ email: "hoaug@xyz.com", password: "123456" });
  process.exit(0);
};

createAdmin().catch(console.error);
