import express from "express";
import {
  listComplaints,
  getComplaint,
  createComplaint,
  deleteComplaint,
  updateComplaint,
  trackComplaint,
  acceptComplaint, // Import the new controller function
  refuseComplaint,
  setComplaintPriority, // Import the new controller function
  toggleWorkingOn,
} from "./controller";
import requireRoles from "../../../middleware/requireRoles";
import { validateWithZod } from "../../../validation";
import {
  createComplaintSchema,
  updateComplaintSchema,
  complaintIdSchema,
  trackingTagSchemaForTrack,
  solutionInfoSchemaForAccept,
  refusalReasonSchemaForRefuse,
} from "../../../validation";

const complaints = express.Router();

// Anyone can create a complaint
complaints.post("/", validateWithZod(createComplaintSchema), createComplaint);

// NEW: Public endpoint for anyone to track a complaint by its tag
complaints.get(
  "/track/:trackingTag",
  validateWithZod(trackingTagSchemaForTrack),
  trackComplaint,
);

// Manager, Admin, and Mukhtar can list complaints they are assigned to
complaints.get(
  "/",
  requireRoles(["manager", "admin", "mukhtar"]),
  listComplaints,
);

// Manager, Admin, and Mukhtar can get details of a specific complaint they can see
complaints.get(
  "/:id",
  requireRoles(["manager", "admin", "mukhtar"]),
  validateWithZod(complaintIdSchema),
  getComplaint,
);

// NEW: Accept a complaint with solution info
complaints.patch(
  "/:id/accept",
  requireRoles(["manager", "admin", "mukhtar"]),
  validateWithZod(complaintIdSchema),
  validateWithZod(solutionInfoSchemaForAccept),
  acceptComplaint,
);

// NEW: Refuse a complaint with refusal reason
complaints.patch(
  "/:id/refuse",
  requireRoles(["manager", "admin", "mukhtar"]),
  validateWithZod(complaintIdSchema),
  validateWithZod(refusalReasonSchemaForRefuse),
  refuseComplaint,
);

// Manager, Admin, and Mukhtar can update complaints (but not status)
complaints.patch(
  "/:id",
  requireRoles(["manager", "admin", "mukhtar"]),
  validateWithZod(updateComplaintSchema),
  updateComplaint,
);

// Manager can hard delete, Mukhtar can soft delete
complaints.delete(
  "/:id",
  requireRoles(["manager", "mukhtar"]),
  validateWithZod(complaintIdSchema),
  deleteComplaint,
);

complaints.patch(
  "/:id/priority",
  requireRoles(["admin"]),
  validateWithZod(complaintIdSchema),
  setComplaintPriority,
);

complaints.patch(
  "/:id/toggle-working-on",
  requireRoles(["admin"]),
  validateWithZod(complaintIdSchema),
  toggleWorkingOn,
);

export default complaints;
