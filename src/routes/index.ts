import express from "express";
import userRoutes from "./user.routes.ts";
import bookRoutes from "./book.routes.ts";
import authRoute from "./auth.routes.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

const router = express.Router();

router.use("/auth", authRoute);

// User route
router.use("/users", userRoutes);
router.use("/books", bookRoutes);

export default router;
