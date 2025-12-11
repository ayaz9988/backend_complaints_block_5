import express from "express";
import {
  createInitiative,
  listInitiatives,
  getInitiative,
  updateInitiative,
  deleteInitiative,
} from "./controller";
import requireRoles from "../../../middleware/requireRoles";

const initiatives = express.Router();

// Public endpoint for creating initiatives
initiatives.post("/", createInitiative);

// Protected endpoints for manager and admin
initiatives.get("/", requireRoles(["manager", "admin"]), listInitiatives);

initiatives.get("/:id", requireRoles(["manager", "admin"]), getInitiative);

initiatives.patch("/:id", requireRoles(["manager", "admin"]), updateInitiative);

initiatives.delete(
  "/:id",
  requireRoles(["manager", "admin"]),
  deleteInitiative,
);

export default initiatives;
