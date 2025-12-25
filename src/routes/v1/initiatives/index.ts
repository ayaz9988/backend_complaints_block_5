import express from "express";
import {
  createInitiative,
  listInitiatives,
  getInitiative,
  updateInitiative,
  deleteInitiative,
} from "./controller";
import requireRoles from "../../../middleware/requireRoles";
import { validateWithZod } from "../../../validation";
import {
  createInitiativeSchema,
  updateInitiativeSchema,
  initiativeIdSchema,
} from "../../../validation";

const initiatives = express.Router();

// Public endpoint for creating initiatives
initiatives.post(
  "/",
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

export default initiatives;
