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
  initiativeIdSchema,
  approveInitiativeSchema,
  rejectInitiativeSchema,
} from "../../../validation";
import { anonymousCombinedRateLimiter } from "../../../middleware/rateLimiter";

const initiatives = express.Router();

// Public endpoint for creating initiatives
initiatives.post(
  "/",
  anonymousCombinedRateLimiter,
  validateWithZod(createInitiativeSchema),
  createInitiative,
);

// Protected endpoints for manager and admin
initiatives.get("/", requireRoles(["manager", "admin"]), listInitiatives);

initiatives.get(
  "/:id",
  requireRoles(["manager", "admin"]),
  validateWithZod(initiativeIdSchema),
  getInitiative,
);

initiatives.patch(
  "/:id",
  requireRoles(["manager", "admin"]),
  validateWithZod(updateInitiativeSchema),
  updateInitiative,
);

initiatives.delete(
  "/:id",
  requireRoles(["manager", "admin"]),
  validateWithZod(initiativeIdSchema),
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
