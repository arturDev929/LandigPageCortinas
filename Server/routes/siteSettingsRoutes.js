import { Router } from "express";
import { siteSettingsController } from "../controllers/siteSettingsController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdmin } from "../middleware/sessionStore.js";

export const siteSettingsRoutes = Router();

siteSettingsRoutes.get("/", asyncHandler(siteSettingsController.get));
siteSettingsRoutes.put("/", requireAdmin, asyncHandler(siteSettingsController.update));
