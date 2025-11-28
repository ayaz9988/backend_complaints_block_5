import express from "express";
import {
  listAchievements,
  getAchievement,
  createAchievement,
  updateAchievement,
  deleteAchievement,
} from "./controller";
import requireRoles from "../../../middleware/requireRoles";

const achievements = express.Router();

// Public routes
achievements.get("/", listAchievements);
achievements.get("/:id", getAchievement);

// Manager and Admin only routes
achievements.post("/", requireRoles(["manager", "admin"]), createAchievement);

achievements.patch(
  "/:id",
  requireRoles(["manager", "admin"]),
  updateAchievement,
);

achievements.delete(
  "/:id",
  requireRoles(["manager", "admin"]),
  deleteAchievement,
);

export default achievements;
