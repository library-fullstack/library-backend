import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import db from "../src/config/db.js";

const createAdmin = async () => {
  const id = uuidv4();
  const PEPPER = process.env.PASSWORD_PEPPER || "";
  const hash = await bcrypt.hash("Kinhhoang@2" + PEPPER, 10);

  await db.query(
    `
    INSERT INTO users (id, studentId, full_name, email, password, role, status)
    VALUES (?, NULL, ?, ?, ?, 'ADMIN', 'ACTIVE')
    `,
    [id, "Trần Kính Hoàng", "hoaug@duck.com", hash]
  );

  console.log("Đã tạo thành công tài khoản Admin:");
  console.log({ email: "hoaug@duck.com", password: "Kinhhoang@2" });
  process.exit(0);
};

createAdmin().catch(console.error);
