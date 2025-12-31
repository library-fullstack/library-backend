import { Router } from "express";
import {
  getAllEvents,
  getEventById,
  getEventBySlug,
  createEvent,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getLatestEvents,
} from "../controllers/events.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

const router = Router();

router.get("/", getAllEvents);
router.get("/upcoming", getUpcomingEvents);
router.get("/latest", getLatestEvents);
router.get("/:id", getEventById);
router.get("/slug/:slug", getEventBySlug);

router.post("/", authenticate, authorize("ADMIN", "LIBRARIAN"), createEvent);
router.put("/:id", authenticate, authorize("ADMIN", "LIBRARIAN"), updateEvent);
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "LIBRARIAN"),
  deleteEvent
);

export default router;
