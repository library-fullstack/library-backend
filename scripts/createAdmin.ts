import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config";
import db from "../src/config/db.ts";

const createAdmin = async () => {
  const id = uuidv4();
  const PEPPER = process.env.PASSWORD_PEPPER || "";
  const hash = await bcrypt.hash("123456" + PEPPER, 10);

  await db.query(
    `
  INSERT INTO users
    (id, student_id, full_name, email, password, phone, role, status, avatar_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      id,
      null,
      "Trần Kính Hoàng",
      "hoaug@duck.com",
      hash,
      "0869995472",
      "ADMIN",
      "ACTIVE",
      null,
    ]
  );

  console.log("Đã tạo thành công tài khoản Admin:");
  console.log({ email: "hoaug@duck.com", password: "123456" });
  process.exit(0);
};

createAdmin().catch(console.error);
