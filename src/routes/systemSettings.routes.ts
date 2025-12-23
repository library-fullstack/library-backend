import { Router } from "express";
import * as systemSettingsController from "../controllers/systemSettings.controller.ts";
import { authorize } from "../middlewares/authorize.middleware.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";

const router = Router();

router.get(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  systemSettingsController.getAllSettings
);

router.get(
  "/:key",
  authMiddleware,
  authorize("ADMIN"),
  systemSettingsController.getSettingByKey
);

router.post(
  "/",
  authMiddleware,
  authorize("ADMIN"),
  systemSettingsController.createSetting
);

router.put(
  "/:key",
  authMiddleware,
  authorize("ADMIN"),
  systemSettingsController.updateSetting
);

router.post(
  "/upsert",
  authMiddleware,
  authorize("ADMIN"),
  systemSettingsController.upsertSetting
);

router.delete(
  "/:key",
  authMiddleware,
  authorize("ADMIN"),
  systemSettingsController.deleteSetting
);

export default router;
