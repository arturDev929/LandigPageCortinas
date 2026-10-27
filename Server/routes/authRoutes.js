import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/authController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdmin } from "../middleware/sessionStore.js";

export const authRoutes = Router();

authRoutes.post(
  "/login",
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false }),
  asyncHandler(authController.login)
);
authRoutes.get("/session", requireAdmin, asyncHandler(authController.session));
authRoutes.post("/logout", requireAdmin, asyncHandler(authController.logout));
