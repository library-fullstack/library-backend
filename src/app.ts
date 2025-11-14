import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "./config/env.ts";
import { errorMiddleware } from "./middlewares/error.middleware.ts";
import { standardRateLimit } from "./middlewares/rate-limit.middleware.ts";
import { performanceMiddleware } from "./middlewares/performance.middleware.ts";
import router from "./routes/index.ts";

const app = express();

// Performance monitoring - track all requests
app.use(performanceMiddleware);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser - MUST be after body parser
app.use(cookieParser());

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
  })
);

// Compression cho responses
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balance giữa tốc độ và compression ratio
  })
);

// Logging
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limiting - apply globally (exclude OPTIONS preflight requests)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }
  standardRateLimit(req, res, next);
});

const allowedOrigins = env.FRONTEND_ORIGINS;

console.log("Cấu hình CORS:");
console.log("Các tên miền cho phép yêu cầu:", allowedOrigins);
console.log("LAN IP hỗ trợ: 192.168.x.x,171.x.x.x, 172.x.x.x");

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        console.log("CORS: Cho phép yêu cầu khi không có tên miền");
        return callback(null, true);
      }

      // lấy cors từ env
      if (allowedOrigins.includes(origin)) {
        console.log("CORS: Cho phép tiền miền từ whitelist:", origin);
        return callback(null, true);
      }

      // cho phép all LAN và public IP
      const isLAN =
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^http:\/\/172\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^http:\/\/171\.\d+\.\d+\.\d+(:\d+)?$/.test(origin);

      if (isLAN) {
        console.log("CORS: Cho phép LAN IP:", origin);
        return callback(null, true);
      }

      console.error("CORS: Chặn yêu cầu từ tên miền:", origin);
      callback(new Error("Không cho phép truy cập"));
    },
    credentials: true,
  })
);

app.use("/api/v1", router);
app.use(errorMiddleware);

export default app;
