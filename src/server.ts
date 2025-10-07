import dotenv from "dotenv";
import app from "./app.ts";
import { env, requireEnv } from "./config/env.ts";

dotenv.config();

const PORT = requireEnv("SERVER_PORT");

(async () => {
  try {
    // chạy server
    app.listen(PORT, () => {
      console.log(`Server đang chạy tại: http://localhost:${PORT}`);
      console.log(`Môi trường: ${env.NODE_ENV}`);
    });
  } catch (err) {
    console.error("Lỗi khi khởi động server:", err);
    process.exit(1);
  }
})();
