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
} from "./controller";
import requireRoles from "../../../middleware/requireRoles";

const complaints = express.Router();

// Anyone can create a complaint
complaints.post("/", createComplaint);

// NEW: Public endpoint for anyone to track a complaint by its tag
complaints.get("/track/:trackingTag", trackComplaint);

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
  getComplaint,
);

// NEW: Accept a complaint with solution info
complaints.patch(
  "/:id/accept",
  requireRoles(["manager", "admin", "mukhtar"]),
  acceptComplaint,
);

// NEW: Refuse a complaint with refusal reason
complaints.patch(
  "/:id/refuse",
  requireRoles(["manager", "admin", "mukhtar"]),
  refuseComplaint,
);

// Manager, Admin, and Mukhtar can update complaints (but not status)
complaints.patch(
  "/:id",
  requireRoles(["manager", "admin", "mukhtar"]),
  updateComplaint,
);

// Manager can hard delete, Mukhtar can soft delete
complaints.delete(
  "/:id",
  requireRoles(["manager", "mukhtar"]),
  deleteComplaint,
);

complaints.patch(
  "/:id/priority",
  requireRoles(["admin"]),
  setComplaintPriority,
);

export default complaints;
