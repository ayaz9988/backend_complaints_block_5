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
import { anonymousCombinedRateLimiter } from "../../../middleware/rateLimiter";
import { uploadMediaOptional } from "../../../lib/upload";

const complaints = express.Router();

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

// Anyone can create a complaint - Apply rate limiting for anonymous users
// For multipart/form-data, run upload first then validate
complaints.post(
  "/",
  anonymousCombinedRateLimiter,
  uploadMediaOptional(),
  handleMulterError,
  validateWithZod(createComplaintSchema),
  createComplaint,
);

// NEW: Public endpoint for anyone to track a complaint by its tag - Apply rate limiting for anonymous users
complaints.get(
  "/track/:trackingTag",
  anonymousCombinedRateLimiter,
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
  uploadMediaOptional(),
  handleMulterError,
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
