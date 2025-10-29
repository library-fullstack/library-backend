import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import app from "./app.ts";
import { env } from "./config/env.ts";

const useHttps =
  fs.existsSync("origin.pem") && fs.existsSync("origin-private.pem");

if (useHttps) {
  const options = {
    key: fs.readFileSync(path.join(process.cwd(), "origin-private.pem")),
    cert: fs.readFileSync(path.join(process.cwd(), "origin.pem")),
  };

  https.createServer(options, app).listen(443, "0.0.0.0", () => {
    console.log("HTTPS server chạy tại https://api.libsys.me");
  });
} else {
  http.createServer(app).listen(env.SERVER_PORT, "0.0.0.0", () => {
    console.log(`HTTP server chạy tại http://localhost:${env.SERVER_PORT}`);
  });
}
