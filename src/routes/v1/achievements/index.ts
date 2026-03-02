import express from "express";
import {
  listAchievements,
  getAchievement,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from "./controller";
import requireRoles from "../../../middleware/requireRoles";
import { validateWithZod } from "../../../validation";
import {
  createAchievementSchema,
  updateAchievementSchema,
  achievementIdSchema,
} from "../../../validation";
import { uploadMediaOptional } from "../../../lib/upload";

const achievements = express.Router();

// Middleware to handle multer errors
const handleMulterError = (
  err: Error,
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => {
  if (err.message.includes("Invalid file type")) {
    return res.status(400).json({ error: "Invalid file type" });
  }
  if (err.message.includes("size exceeds")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

// Public routes
achievements.get("/", listAchievements);
achievements.get("/:id", validateWithZod(achievementIdSchema), getAchievement);

// Manager and Admin only routes
achievements.post(
  "/",
  requireRoles(["manager", "admin"]),
  uploadMediaOptional(),
  handleMulterError,
  validateWithZod(createAchievementSchema),
  createAchievement,
);

achievements.patch(
  "/:id",
  requireRoles(["manager", "admin"]),
  uploadMediaOptional(),
  handleMulterError,
  validateWithZod(achievementIdSchema),
  validateWithZod(updateAchievementSchema),
  updateAchievement,
);

achievements.delete(
  "/:id",
  requireRoles(["manager", "admin"]),
  validateWithZod(achievementIdSchema),
  deleteAchievement,
);

export default achievements;
