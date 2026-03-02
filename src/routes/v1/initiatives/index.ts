import express from "express";
import {
  createInitiative,
  listInitiatives,
  getInitiative,
  updateInitiative,
  deleteInitiative,
  approveInitiative,
  rejectInitiative,
} from "./controller";
import requireRoles from "../../../middleware/requireRoles";
import { validateWithZod } from "../../../validation";
import {
  createInitiativeSchema,
  updateInitiativeSchema,
  approveInitiativeSchema,
  rejectInitiativeSchema,
} from "../../../validation";
import { anonymousCombinedRateLimiter } from "../../../middleware/rateLimiter";
import { uploadMediaOptional } from "../../../lib/upload";

const initiatives = express.Router();

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

// Public endpoint for creating initiatives
initiatives.post(
  "/",
  anonymousCombinedRateLimiter,
  uploadMediaOptional(),
  handleMulterError,
  validateWithZod(createInitiativeSchema),
  createInitiative,
);

// Protected endpoints for manager and admin
initiatives.get("/", requireRoles(["manager", "admin"]), listInitiatives);

// For GET, PATCH, DELETE - validate ID in controller to return 404 for invalid IDs
initiatives.get("/:id", requireRoles(["manager", "admin"]), getInitiative);

initiatives.patch(
  "/:id",
  requireRoles(["manager", "admin"]),
  uploadMediaOptional(),
  handleMulterError,
  validateWithZod(updateInitiativeSchema),
  updateInitiative,
);

initiatives.delete(
  "/:id",
  requireRoles(["manager", "admin"]),
  deleteInitiative,
);

// Approve initiative endpoint
initiatives.put(
  "/:id/approve",
  requireRoles(["manager", "admin"]),
  validateWithZod(approveInitiativeSchema),
  approveInitiative,
);

// Reject initiative endpoint
initiatives.put(
  "/:id/reject",
  requireRoles(["manager", "admin"]),
  validateWithZod(rejectInitiativeSchema),
  rejectInitiative,
);

export default initiatives;
