import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import app from "./app";
import { env } from "./config/env";
import { startBorrowReminderJob } from "./jobs/borrowReminder.job";

const useHttps =
  fs.existsSync("origin.pem") && fs.existsSync("origin-private.pem");

console.log("[SERVER] Bắt đầu công việc định kỳ...");
startBorrowReminderJob();

const PORT = env.SERVER_PORT || 3000;

if (useHttps) {
  const options = {
    key: fs.readFileSync(path.join(process.cwd(), "origin-private.pem")),
    cert: fs.readFileSync(path.join(process.cwd(), "origin.pem")),
  };

  https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
    console.log(`HTTPS server chạy tại https://api.libsys.me trên port ${PORT}`);
  });
} else {
  http.createServer(app).listen(PORT, "0.0.0.0", () => {
    console.log(`HTTP server chạy tại http://0.0.0.0:${PORT}`);
  });
}
