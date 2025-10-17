import express from "express";
import userRoutes from "./user.routes.ts";
import bookRoutes from "./book/book.routes.ts";
import authRoute from "./auth.routes.ts";
import adminRoute from "./admin.routes.ts";

const router = express.Router();

router.use("/auth", authRoute);

// users route
router.use("/users", userRoutes);

// books route
router.use("/books", bookRoutes);

// admin route
router.use("/admin", adminRoute);

export default router;
