import express from "express";
import userRoutes from "./user.routes.ts";

const router = express.Router();

// User route
router.use("/users", userRoutes);

export default router;
