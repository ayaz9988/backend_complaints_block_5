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

const achievements = express.Router();

// Public routes
achievements.get("/", listAchievements);
achievements.get("/:id", validateWithZod(achievementIdSchema), getAchievement);

// Manager and Admin only routes
achievements.post(
  "/",
  requireRoles(["manager", "admin"]),
  validateWithZod(createAchievementSchema),
  createAchievement,
);

achievements.patch(
  "/:id",
  requireRoles(["manager", "admin"]),
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
