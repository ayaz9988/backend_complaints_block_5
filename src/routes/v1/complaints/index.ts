import express from "express";
import {
  listComplaints,
  getComplaint,
  createComplaint,
  deleteComplaint,
  handleComplaint,
} from "./controller";
import requireRoles from "../../../middleware/requireRoles";

const complaints = express.Router();

// Anyone can create a complaint (e.g., website user without account)
complaints.post("/", createComplaint);

// Manager and Admin can list complaints and get details
complaints.get(
  "/",
  requireRoles(["manager", "admin", "mukhtar"]),
  listComplaints,
);
complaints.get(
  "/:id",
  requireRoles(["manager", "admin", "mukhtar"]),
  getComplaint,
);

// Only manager can update complaints (handle = accept/refuse)
complaints.patch("/:id", requireRoles(["manager"]), handleComplaint);

// Only manager can soft delete complaints
complaints.delete(
  "/:id",
  requireRoles(["manager", "mukhtar"]),
  deleteComplaint,
);

export default complaints;
