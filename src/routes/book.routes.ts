import express from "express";
import {
  getAllBookController,
  getBookByIdController,
  createBookController,
  updateBookByIdController,
} from "../controllers/book.controller.ts";

const router = express.Router();

router.get("/", getAllBookController);
router.get("/:bookId", getBookByIdController);
router.post("/", createBookController);
router.put("/:userId", updateBookByIdController);

export default router;
