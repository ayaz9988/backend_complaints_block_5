"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requireRoles_1 = __importDefault(
  require("../../../middleware/requireRoles"),
);
const controller_1 = require("./controller");
const users = (0, express_1.Router)();
// Get users by role - requires manager or admin role
users.get(
  "/",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.getUsersByRole,
);
// Get user by ID - requires manager or admin role
users.get(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.getUserById,
);
// Get complaints handled by a user - requires manager or admin role
users.get(
  "/:id/complaints",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.getUserComplaints,
);
// Update user info - requires manager or admin role
users.patch(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.updateUser,
);
// Deactivate user - requires manager or admin role
users.patch(
  "/:id/deactivate",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.deactivateUser,
);
// Delete user - requires manager role only
users.delete(
  "/:id",
  (0, requireRoles_1.default)(["manager"]),
  controller_1.deleteUser,
);
exports.default = users;
