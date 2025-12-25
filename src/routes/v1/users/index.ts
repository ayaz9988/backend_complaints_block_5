import { Router } from "express";
import requireRoles from "../../../middleware/requireRoles";
import { validateWithZod } from "../../../validation";
import {
  getUserByIdSchema,
  updateUserSchema,
  deactivateUserSchema,
  deleteUserSchema,
  getUsersByRoleSchema,
  userIdSchema,
} from "../../../validation";
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
users.get(
  "/",
  requireRoles(["manager", "admin"]),
  validateWithZod(getUsersByRoleSchema),
  getUsersByRole,
);

// Get user by ID - requires manager or admin role
users.get(
  "/:id",
  requireRoles(["manager", "admin"]),
  validateWithZod(userIdSchema),
  getUserById,
);

// Get complaints handled by a user - requires manager or admin role
users.get(
  "/:id/complaints",
  requireRoles(["manager", "admin"]),
  validateWithZod(userIdSchema),
  getUserComplaints,
);

// Update user info - requires manager or admin role
users.patch(
  "/:id",
  requireRoles(["manager", "admin"]),
  validateWithZod(userIdSchema),
  validateWithZod(updateUserSchema),
  updateUser,
);

// Deactivate user - requires manager or admin role
users.patch(
  "/:id/deactivate",
  requireRoles(["manager", "admin"]),
  validateWithZod(userIdSchema),
  deactivateUser,
);

// Delete user - requires manager role only
users.delete(
  "/:id",
  requireRoles(["manager"]),
  validateWithZod(userIdSchema),
  deleteUser,
);

export default users;
