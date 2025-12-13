"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const requireRoles_1 = __importDefault(
  require("../../../middleware/requireRoles"),
);
const complaints = express_1.default.Router();
// Anyone can create a complaint
complaints.post("/", controller_1.createComplaint);
// NEW: Public endpoint for anyone to track a complaint by its tag
complaints.get("/track/:trackingTag", controller_1.trackComplaint);
// Manager, Admin, and Mukhtar can list complaints they are assigned to
complaints.get(
  "/",
  (0, requireRoles_1.default)(["manager", "admin", "mukhtar"]),
  controller_1.listComplaints,
);
// Manager, Admin, and Mukhtar can get details of a specific complaint they can see
complaints.get(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin", "mukhtar"]),
  controller_1.getComplaint,
);
// NEW: Accept a complaint with solution info
complaints.patch(
  "/:id/accept",
  (0, requireRoles_1.default)(["manager", "admin", "mukhtar"]),
  controller_1.acceptComplaint,
);
// NEW: Refuse a complaint with refusal reason
complaints.patch(
  "/:id/refuse",
  (0, requireRoles_1.default)(["manager", "admin", "mukhtar"]),
  controller_1.refuseComplaint,
);
// Manager, Admin, and Mukhtar can update complaints (but not status)
complaints.patch(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin", "mukhtar"]),
  controller_1.updateComplaint,
);
// Manager can hard delete, Mukhtar can soft delete
complaints.delete(
  "/:id",
  (0, requireRoles_1.default)(["manager", "mukhtar"]),
  controller_1.deleteComplaint,
);
complaints.patch(
  "/:id/priority",
  (0, requireRoles_1.default)(["admin"]),
  controller_1.setComplaintPriority,
);
complaints.patch(
  "/:id/toggle-working-on",
  (0, requireRoles_1.default)(["admin"]),
  controller_1.toggleWorkingOn,
);
exports.default = complaints;
