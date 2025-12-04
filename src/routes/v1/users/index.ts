import { Router } from "express";
import requireRoles from "../../../middleware/requireRoles";
import {
  getUserById,
  getUserComplaints,
  updateUser,
  deactivateUser,
  deleteUser,
  getUsersByRole, // Add this import
} from "./controller";

const users = Router();

// Get users by role - requires manager or admin role
users.get("/", requireRoles(["manager", "admin"]), getUsersByRole);

// Get user by ID - requires manager or admin role
users.get("/:id", requireRoles(["manager", "admin"]), getUserById);

// Get complaints handled by a user - requires manager or admin role
users.get(
  "/:id/complaints",
  requireRoles(["manager", "admin"]),
  getUserComplaints,
);

// Update user info - requires manager or admin role
users.patch("/:id", requireRoles(["manager", "admin"]), updateUser);

// Deactivate user - requires manager or admin role
users.patch(
  "/:id/deactivate",
  requireRoles(["manager", "admin"]),
  deactivateUser,
);

// Delete user - requires manager role only
users.delete("/:id", requireRoles(["manager"]), deleteUser);

export default users;
