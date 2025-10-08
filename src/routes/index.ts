import express from "express";
import userRoutes from "./user.routes.ts";
import bookRoutes from "./book.routes.ts";

const router = express.Router();

// User route
router.use("/users", userRoutes);
router.use("/books", bookRoutes);

export default router;
