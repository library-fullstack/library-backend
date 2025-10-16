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
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/v1", router);

app.use((req, res) => {
  res.status(404).json({
    message: "Endpoint not found",
    path: req.originalUrl,
  });
});

app.use(errorMiddleware);

export default app;
