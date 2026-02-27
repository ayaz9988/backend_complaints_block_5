import { Request, Response } from "express";
import prisma from "../../../prisma";
import crypto from "crypto";

/**
 * Helper function to handle BigInt serialization for complaint objects.
 * JavaScript's native JSON.stringify() cannot handle BigInt values.
 * This function converts BigInt id to a string.
 * @param complaint - The complaint object from Prisma
 * @returns A new complaint object with a stringified id
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeComplaint = (complaint: any) => {
  return {
    ...complaint,
    id: complaint.id.toString(),
    working_on_by: complaint.working_on_by,
  };
};

// Helper to determine estimated review time based on priority
const getEstimatedReviewTime = (priority: "high" | "mid" | "low"): string => {
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
export async function listComplaints(req: Request, res: Response) {
  try {
    const userRole = req.user?.role;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

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

    const complaints = await prisma.complaints.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    res.json(complaints.map(serializeComplaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
}

export async function getComplaint(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const complaint = await prisma.complaints.findFirst({
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
export async function createComplaint(req: Request, res: Response) {
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
    const trackingTag = crypto.randomUUID(); // Generate a unique tracking tag
    const newComplaint = await prisma.complaints.create({
      data: {
        submitterName,
        contactNumber,
        description,
        priority: "mid",
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
export async function acceptComplaint(req: Request, res: Response) {
  const { id } = req.params;
  const { solutionInfo } = req.body;

  if (!solutionInfo || solutionInfo.trim() === "") {
    return res.status(400).json({
      error: "Solution info is required when accepting a complaint.",
    });
  }

  try {
    // First, fetch the current complaint to check its existing status
    const currentComplaint = await prisma.complaints.findUnique({
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

    const updatedComplaint = await prisma.complaints.update({
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
export async function refuseComplaint(req: Request, res: Response) {
  const { id } = req.params;
  const { refusalReason } = req.body;

  if (!refusalReason || refusalReason.trim() === "") {
    return res.status(400).json({
      error: "Refusal reason is required when refusing a complaint.",
    });
  }

  try {
    // First, fetch the current complaint to check its existing status
    const currentComplaint = await prisma.complaints.findUnique({
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

    const updatedComplaint = await prisma.complaints.update({
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
export async function updateComplaint(req: Request, res: Response) {
  const { id } = req.params;
  const { priority, notes, estimatedReviewTime } = req.body;

  try {
    const currentComplaint = await prisma.complaints.findUnique({
      where: { id: BigInt(id) },
    });

    if (!currentComplaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    // Update other fields if they are provided in the request
    if (priority) updateData.priority = priority;
    if (notes) updateData.notes = notes;
    if (estimatedReviewTime)
      updateData.estimatedReviewTime = estimatedReviewTime;

    const updatedComplaint = await prisma.complaints.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    res.json(serializeComplaint(updatedComplaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to update complaint" });
  }
}

// No changes needed here, logic remains the same
export async function deleteComplaint(req: Request, res: Response) {
  const { id } = req.params;
  const userRole = req.user?.role;

  try {
    const complaint = await prisma.complaints.findUnique({
      where: { id: BigInt(id) },
    });
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (userRole === "manager") {
      await prisma.complaints.delete({ where: { id: BigInt(id) } });
      res.json({ message: "Complaint permanently deleted" });
    } else if (userRole === "mukhtar") {
      await prisma.complaints.update({
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
export async function trackComplaint(req: Request, res: Response) {
  const { trackingTag } = req.params;

  if (!trackingTag) {
    return res.status(400).json({ error: "Tracking tag is required" });
  }

  try {
    const complaint = await prisma.complaints.findUnique({
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

export async function toggleWorkingOn(req: Request, res: Response) {
  const { id } = req.params;
  const userId = req.user?.sub;

  try {
    // Convert ID to BigInt
    const complaintId = BigInt(id);

    // First, check if the complaint exists
    const complaint = await prisma.complaints.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Toggle the working_on status
    const newIsWorkingOn = !complaint.is_working_on;
    const workingOnBy = newIsWorkingOn ? userId : null;

    // Update the complaint
    const updatedComplaint = await prisma.complaints.update({
      where: { id: complaintId },
      data: {
        is_working_on: newIsWorkingOn,
        working_on_by: workingOnBy,
      },
    });

    // Return the updated complaint
    res.json(serializeComplaint(updatedComplaint));
  } catch (error) {
    res.status(500).json({
      error: "Failed to toggle working on status",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function setComplaintPriority(req: Request, res: Response) {
  const { id } = req.params;
  const { priority } = req.body;

  if (!priority || !["high", "mid", "low"].includes(priority)) {
    return res
      .status(400)
      .json({ error: "Valid priority (high, mid, low) is required" });
  }

  try {
    const complaint = await prisma.complaints.findUnique({
      where: { id: BigInt(id) },
    });

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const updatedComplaint = await prisma.complaints.update({
      where: { id: BigInt(id) },
      data: { priority, estimatedReviewTime: getEstimatedReviewTime(priority) },
    });

    res.json(serializeComplaint(updatedComplaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to set complaint priority" });
  }
}
