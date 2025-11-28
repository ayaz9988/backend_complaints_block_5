import express from "express";
import {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "./controller";
import requireRoles from "../../../middleware/requireRoles";

const announcements = express.Router();

// Public routes
announcements.get("/", listAnnouncements);
announcements.get("/:id", getAnnouncement);

// Manager and Admin only routes
announcements.post("/", requireRoles(["manager", "admin"]), createAnnouncement);

announcements.patch(
  "/:id",
  requireRoles(["manager", "admin"]),
  updateAnnouncement,
);

announcements.delete(
  "/:id",
  requireRoles(["manager", "admin"]),
  deleteAnnouncement,
);

export default announcements;
