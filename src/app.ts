// src/app.ts
import express from "express";
import type { Application, Request, Response } from "express";
import routes from "./routes/index.ts";
// import cors from "cors";
// import morgan from "morgan";
// import routes from "./routes/index.js";
// import { env } from "./config/env.ts";

const app: Application = express();

// middlewares
// app.use(cors());
// app.use(express.json());
// app.use(morgan("dev"));

// route test
// app.get("/", (req: Request, res: Response) => {
//   res.json({
//     message: "OK",
//     docs: "/api",
//     environment: env.NODE_ENV,
//   });
// });

app.use(express.json());
app.use("/api/v1", routes);

// app.use("/api", routes);

// xử lí lỗi
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.originalUrl,
  });
});

// xử lí lỗi
app.use((err: any, req: Request, res: Response, next: Function) => {
  console.error("Lỗi trong hệ thống:", err);
  res.status(500).json({
    error: "Server Error",
    message: err.message,
  });
});

export default app;
