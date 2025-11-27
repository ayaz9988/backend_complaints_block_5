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

// UPDATED: Add trackingTag, priority, and estimated time on creation
export async function createComplaint(req: Request, res: Response) {
  const {
    submitterName,
    contactNumber,
    description,
    location,
    neighborhood,
    complaint_type,
    priority = "mid", // Default to 'mid' if not provided
  } = req.body;

  try {
    const trackingTag = crypto.randomUUID(); // Generate a unique tracking tag
    const estimatedReviewTime = getEstimatedReviewTime(priority);

    const newComplaint = await prisma.complaints.create({
      data: {
        submitterName,
        contactNumber,
        description,
        location,
        neighborhood,
        complaint_type,
        priority,
        trackingTag,
        estimatedReviewTime,
        complaint_status: "pending", // Default status
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

// UPDATED: Enforces state transitions and required fields
export async function updateComplaint(req: Request, res: Response) {
  const { id } = req.params;
  const {
    complaint_status,
    priority,
    notes,
    solutionInfo,
    refusalReason,
    estimatedReviewTime,
  } = req.body;

  try {
    // First, fetch the current complaint to check its existing status
    const currentComplaint = await prisma.complaints.findUnique({
      where: { id: BigInt(id) },
      select: { complaint_status: true }, // We only need the current status for validation
    });

    if (!currentComplaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    const updateData: any = {};

    // --- STATE AND FIELD VALIDATION ---
    if (complaint_status) {
      // Prevent reverting a complaint back to 'pending'
      if (
        complaint_status === "pending" &&
        currentComplaint.complaint_status !== "pending"
      ) {
        return res.status(400).json({
          error:
            "Cannot set a complaint back to 'pending' once it has been processed.",
        });
      }

      if (complaint_status === "accepted") {
        // When accepting, solutionInfo is mandatory
        if (!solutionInfo || solutionInfo.trim() === "") {
          return res.status(400).json({
            error: "Solution info is required when accepting a complaint.",
          });
        }
        updateData.complaint_status = "accepted";
        updateData.solutionInfo = solutionInfo;
        updateData.refusalReason = null; // Clear any previous refusal reason
      } else if (complaint_status === "refused") {
        // When refusing, refusalReason is mandatory
        if (!refusalReason || refusalReason.trim() === "") {
          return res.status(400).json({
            error: "Refusal reason is required when refusing a complaint.",
          });
        }
        updateData.complaint_status = "refused";
        updateData.refusalReason = refusalReason;
        updateData.solutionInfo = null; // Clear any previous solution info
      } else {
        // This will only be hit if the status is 'pending' and it was already 'pending',
        // which is a no-op for the status itself.
        updateData.complaint_status = complaint_status;
      }
    }

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

// NEW: Public endpoint to track a complaint by its unique tag
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
