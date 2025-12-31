import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import app from "./app";
import { env } from "./config/env";
import { startBorrowReminderJob } from "./jobs/borrowReminder.job";

const useHttps =
  fs.existsSync("origin.pem") && fs.existsSync("origin-private.pem");

console.log("[SERVER] Bắt đầu công việc định kỳ...");
startBorrowReminderJob();

if (useHttps) {
  const options = {
    key: fs.readFileSync(path.join(process.cwd(), "origin-private.pem")),
    cert: fs.readFileSync(path.join(process.cwd(), "origin.pem")),
  };

  https.createServer(options, app).listen(3000, "0.0.0.0", () => {
    console.log("HTTPS server chạy tại https://api.libsys.me");
  });
} else {
  http.createServer(app).listen(env.SERVER_PORT, "0.0.0.0", () => {
    console.log(`HTTP server chạy tại http://localhost:${env.SERVER_PORT}`);
  });
}
