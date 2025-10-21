import dotenv from "dotenv";
import app from "./app.ts";
import { env, requireEnv } from "./config/env.ts";

dotenv.config();

const PORT = Number(requireEnv("SERVER_PORT")) || 4000;

// http://171.224.19.201:4000
// 172.31.178.248

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`Có thể truy cập từ ngoài qua: http://171.224.19.201:${PORT}`);
  console.log(`Môi trường: ${env.NODE_ENV}`);
});
