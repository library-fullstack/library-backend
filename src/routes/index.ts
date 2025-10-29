import express from "express";
import bookRouter from "./book/book.routes.ts";
import authorRouter from "./book/bookAuthor.route.ts";
import categoryRouter from "./book/bookCategory.route.ts";
import imageRouter from "./book/bookImage.route.ts";
import publisherRouter from "./book/publisher.route.ts";
import tagRouter from "./book/tag.route.ts";
import authRoute from "./auth.routes.ts";
import adminRoute from "./admin.routes.ts";
import userRoute from "./user.routes.ts";
// import borrowRoute from "./borrow.routes.ts";
import forumPostRoute from "./forum/post.routes.ts";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/admin", adminRoute);
router.use("/users", userRoute);
// router.use("/borrows", borrowRoute);
router.use("/books", bookRouter);
router.use("/authors", authorRouter);
router.use("/categories", categoryRouter);
router.use("/images", imageRouter);
router.use("/publishers", publisherRouter);
router.use("/tags", tagRouter);
router.use("/forum/posts", forumPostRoute);

export default router;
