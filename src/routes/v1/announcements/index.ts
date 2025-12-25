import express from "express";
import {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "./controller";
import requireRoles from "../../../middleware/requireRoles";
import { validateWithZod } from "../../../validation";
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementIdSchema,
} from "../../../validation";

const announcements = express.Router();

// Public routes
announcements.get("/", listAnnouncements);
announcements.get(
  "/:id",
  validateWithZod(announcementIdSchema),
  getAnnouncement,
);

// Manager and Admin only routes
announcements.post(
  "/",
  requireRoles(["manager", "admin"]),
  validateWithZod(createAnnouncementSchema),
  createAnnouncement,
);

announcements.patch(
  "/:id",
  requireRoles(["manager", "admin"]),
  validateWithZod(announcementIdSchema),
  validateWithZod(updateAnnouncementSchema),
  updateAnnouncement,
);

announcements.delete(
  "/:id",
  requireRoles(["manager", "admin"]),
  validateWithZod(announcementIdSchema),
  deleteAnnouncement,
);

export default announcements;
