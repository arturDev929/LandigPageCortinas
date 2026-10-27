import express from "express";
import { Router } from "express";
import { productController } from "../controllers/productController.js";
import { imageUploadController } from "../controllers/imageUploadController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAdmin } from "../middleware/sessionStore.js";

export const productRoutes = Router();

productRoutes.get("/", asyncHandler(productController.list));
productRoutes.post("/images", requireAdmin, express.raw({
  type: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  limit: "5mb"
}), asyncHandler(imageUploadController.upload));
productRoutes.post("/", requireAdmin, asyncHandler(productController.create));
productRoutes.put("/:id", requireAdmin, asyncHandler(productController.update));
productRoutes.delete("/:id", requireAdmin, asyncHandler(productController.delete));
