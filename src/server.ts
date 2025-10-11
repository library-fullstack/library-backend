import dotenv from "dotenv";
import app from "./app.ts";
import { env, requireEnv } from "./config/env.ts";

dotenv.config();

const PORT = requireEnv("SERVER_PORT");

app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`Môi trường: ${env.NODE_ENV}`);
});
