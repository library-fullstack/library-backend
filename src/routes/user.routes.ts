import express from "express";
import { UserController } from "../controllers/user.controller.ts";

const router = express.Router();

router.get("/", UserController.getAll);
router.post("/", UserController.createUser);

export default router;
