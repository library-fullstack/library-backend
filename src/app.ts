import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { standardRateLimit } from "./middlewares/rate-limit.middleware";
import { performanceMiddleware } from "./middlewares/performance.middleware";
import router from "./routes/index";

const app = express();

app.use(performanceMiddleware);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(cookieParser());

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false,
  })
);

app.use(
  compression({
    level: 6,
  })
);

app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.use(
  cors({
    origin: ["https://hbh.libsys.me"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use("/api/v1", router);

app.use(errorMiddleware);

export default app;
