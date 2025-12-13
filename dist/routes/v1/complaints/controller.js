"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.listComplaints = listComplaints;
exports.getComplaint = getComplaint;
exports.createComplaint = createComplaint;
exports.acceptComplaint = acceptComplaint;
exports.refuseComplaint = refuseComplaint;
exports.updateComplaint = updateComplaint;
exports.deleteComplaint = deleteComplaint;
exports.trackComplaint = trackComplaint;
exports.toggleWorkingOn = toggleWorkingOn;
exports.setComplaintPriority = setComplaintPriority;
const prisma_1 = __importDefault(require("../../../prisma"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Helper function to handle BigInt serialization for complaint objects.
 * JavaScript's native JSON.stringify() cannot handle BigInt values.
 * This function converts BigInt id to a string.
 * @param complaint - The complaint object from Prisma
 * @returns A new complaint object with a stringified id
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeComplaint = (complaint) => {
  return {
    ...complaint,
    id: complaint.id.toString(),
  };
};
// Helper to determine estimated review time based on priority
const getEstimatedReviewTime = (priority) => {
  switch (priority) {
    case "high":
      return "1-2 business days";
    case "mid":
      return "3-5 business days";
    case "low":
      return "1 week";
    default:
      return "3-5 business days";
  }
};
// UPDATED: Filter complaints by user role and show soft-deleted to manager
async function listComplaints(req, res) {
  try {
    const userRole = req.user?.role;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause = {};
    if (userRole === "manager") {
      // Manager sees high priority complaints, INCLUDING soft-deleted ones.
      // We do not filter by `deletedAt`, so both active and soft-deleted are returned.
      whereClause.priority = "high";
    } else if (userRole === "admin") {
      // Admin sees only active (non-deleted) mid priority complaints.
      whereClause.priority = "mid";
      whereClause.deletedAt = null;
    } else if (userRole === "mukhtar") {
      // Mukhtar sees only active (non-deleted) low priority complaints.
      whereClause.priority = "low";
      whereClause.deletedAt = null;
    }
    const complaints = await prisma_1.default.complaints.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });
    res.json(complaints.map(serializeComplaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
}
async function getComplaint(req, res) {
  const { id } = req.params;
  try {
    const complaint = await prisma_1.default.complaints.findFirst({
      where: { id: BigInt(id), deletedAt: null },
    });
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.json(serializeComplaint(complaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
}
// UPDATED: Add trackingTag, priority, estimated time, and optional suggested solution on creation
async function createComplaint(req, res) {
  const {
    submitterName,
    contactNumber,
    description,
    location,
    neighborhood,
    complaint_type,
    suggestedSolution, // NEW: Optional field for user-provided solution
  } = req.body;
  try {
    const trackingTag = crypto_1.default.randomUUID(); // Generate a unique tracking tag
    const newComplaint = await prisma_1.default.complaints.create({
      data: {
        submitterName,
        contactNumber,
        description,
        location,
        neighborhood,
        complaint_type,
        trackingTag,
        complaint_status: "pending", // Default status
        suggestedSolution, // NEW: Include the optional suggested solution
      },
    });
    // The user needs the trackingTag to follow up
    res.status(201).json({
      ...serializeComplaint(newComplaint),
      trackingTag, // Ensure the tag is clearly in the response
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create complaint",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
// NEW: Accept a complaint with solution info
async function acceptComplaint(req, res) {
  const { id } = req.params;
  const { solutionInfo } = req.body;
  if (!solutionInfo || solutionInfo.trim() === "") {
    return res.status(400).json({
      error: "Solution info is required when accepting a complaint.",
    });
  }
  try {
    // First, fetch the current complaint to check its existing status
    const currentComplaint = await prisma_1.default.complaints.findUnique({
      where: { id: BigInt(id) },
      select: { complaint_status: true }, // We only need the current status for validation
    });
    if (!currentComplaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    // Prevent reverting a complaint back to 'pending'
    if (currentComplaint.complaint_status !== "pending") {
      return res.status(400).json({
        error: "Cannot accept a complaint that is not in 'pending' status.",
      });
    }
    const updatedComplaint = await prisma_1.default.complaints.update({
      where: { id: BigInt(id) },
      data: {
        complaint_status: "accepted",
        solutionInfo: solutionInfo,
        refusalReason: null, // Clear any previous refusal reason
      },
    });
    res.json(serializeComplaint(updatedComplaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to accept complaint" });
  }
}
// NEW: Refuse a complaint with refusal reason
async function refuseComplaint(req, res) {
  const { id } = req.params;
  const { refusalReason } = req.body;
  if (!refusalReason || refusalReason.trim() === "") {
    return res.status(400).json({
      error: "Refusal reason is required when refusing a complaint.",
    });
  }
  try {
    // First, fetch the current complaint to check its existing status
    const currentComplaint = await prisma_1.default.complaints.findUnique({
      where: { id: BigInt(id) },
      select: { complaint_status: true }, // We only need the current status for validation
    });
    if (!currentComplaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    // Prevent reverting a complaint back to 'pending'
    if (currentComplaint.complaint_status !== "pending") {
      return res.status(400).json({
        error: "Cannot refuse a complaint that is not in 'pending' status.",
      });
    }
    const updatedComplaint = await prisma_1.default.complaints.update({
      where: { id: BigInt(id) },
      data: {
        complaint_status: "refused",
        refusalReason: refusalReason,
        solutionInfo: null, // Clear any previous solution info
      },
    });
    res.json(serializeComplaint(updatedComplaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to refuse complaint" });
  }
}
// UPDATED: Simplified update function for non-status changes
async function updateComplaint(req, res) {
  const { id } = req.params;
  const { priority, notes, estimatedReviewTime } = req.body;
  try {
    const currentComplaint = await prisma_1.default.complaints.findUnique({
      where: { id: BigInt(id) },
    });
    if (!currentComplaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData = {};
    // Update other fields if they are provided in the request
    if (priority) updateData.priority = priority;
    if (notes) updateData.notes = notes;
    if (estimatedReviewTime)
      updateData.estimatedReviewTime = estimatedReviewTime;
    const updatedComplaint = await prisma_1.default.complaints.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    res.json(serializeComplaint(updatedComplaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to update complaint" });
  }
}
// No changes needed here, logic remains the same
async function deleteComplaint(req, res) {
  const { id } = req.params;
  const userRole = req.user?.role;
  try {
    const complaint = await prisma_1.default.complaints.findUnique({
      where: { id: BigInt(id) },
    });
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    if (userRole === "manager") {
      await prisma_1.default.complaints.delete({ where: { id: BigInt(id) } });
      res.json({ message: "Complaint permanently deleted" });
    } else if (userRole === "mukhtar") {
      await prisma_1.default.complaints.update({
        where: { id: BigInt(id) },
        data: { deletedAt: new Date() },
      });
      res.json({ message: "Complaint soft deleted" });
    } else {
      res.status(403).json({ error: "Forbidden" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to delete complaint" });
  }
}
// No changes needed here, logic remains the same
async function trackComplaint(req, res) {
  const { trackingTag } = req.params;
  if (!trackingTag) {
    return res.status(400).json({ error: "Tracking tag is required" });
  }
  try {
    const complaint = await prisma_1.default.complaints.findUnique({
      where: {
        trackingTag: trackingTag,
        deletedAt: null, // Ensure we don't return soft-deleted complaints to the public
      },
    });
    if (!complaint) {
      return res
        .status(404)
        .json({ error: "Complaint not found or has been removed" });
    }
    // Omit internal notes from public response
    const { notes, ...complaintWithoutNotes } = complaint;
    // Serialize the BigInt id to a string for the response
    res.json(serializeComplaint(complaintWithoutNotes));
  } catch (error) {
    res.status(500).json({ error: "Failed to track complaint" });
  }
}
async function toggleWorkingOn(req, res) {
  const { id } = req.params;
  const userId = req.user?.id;
  try {
    const complaint = await prisma_1.default.complaints.findUnique({
      where: { id: BigInt(id) },
    });
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    const newIsWorkingOn = !complaint.is_working_on;
    const workingOnBy = newIsWorkingOn ? userId : null;
    const updatedComplaint = await prisma_1.default.complaints.update({
      where: { id: BigInt(id) },
      data: {
        is_working_on: newIsWorkingOn,
        working_on_by: workingOnBy,
      },
    });
    res.json(serializeComplaint(updatedComplaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle working on status" });
  }
}
async function setComplaintPriority(req, res) {
  const { id } = req.params;
  const { priority } = req.body;
  if (!priority || !["high", "mid", "low"].includes(priority)) {
    return res
      .status(400)
      .json({ error: "Valid priority (high, mid, low) is required" });
  }
  try {
    const complaint = await prisma_1.default.complaints.findUnique({
      where: { id: BigInt(id) },
    });
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    const updatedComplaint = await prisma_1.default.complaints.update({
      where: { id: BigInt(id) },
      data: { priority, estimatedReviewTime: getEstimatedReviewTime(priority) },
    });
    res.json(serializeComplaint(updatedComplaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to set complaint priority" });
  }
}
