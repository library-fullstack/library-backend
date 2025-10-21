import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware } from "./middlewares/error.middleware.ts";
import router from "./routes/index.ts";

dotenv.config();

const app = express();

app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://171.224.19.201:5173",
      // "http://172.31.178.248:5173",
    ],
    credentials: true,
  })
);

app.use("/api/v1", router);

app.use(errorMiddleware);

export default app;
