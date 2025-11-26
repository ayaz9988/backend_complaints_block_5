import { Request, Response } from "express";
import prisma from "../../../prisma";

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

export async function listComplaints(req: Request, res: Response) {
  try {
    const complaints = await prisma.complaints.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    // Map over results to convert BigInt id to a string for each complaint
    res.json(complaints.map(serializeComplaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
}

export async function getComplaint(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const complaint = await prisma.complaints.findFirst({
      where: { id: BigInt(id), deletedAt: null }, // Changed from Number(id) to BigInt(id)
    });
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    // Convert BigInt id to a string before sending response
    res.json(serializeComplaint(complaint));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complaint" });
  }
}

export async function createComplaint(req: Request, res: Response) {
  const {
    submitterName,
    contactNumber,
    description,
    location,
    neighborhood,
    complaint_type,
    complaint_status,
  } = req.body;

  try {
    const newComplaint = await prisma.complaints.create({
      data: {
        submitterName,
        contactNumber,
        description,
        location,
        neighborhood,
        complaint_type,
        complaint_status: complaint_status || "pending", // default enum value
      },
    });

    // Convert BigInt id to a string before sending response
    res.status(201).json(serializeComplaint(newComplaint));
  } catch (error) {
    // console.error("Error creating complaint:", error); // Log detailed error for debugging
    res.status(500).json({
      error: "Failed to create complaint",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

// Only manager can update complaint status and other fields
export async function handleComplaint(req: Request, res: Response) {
  const { id } = req.params;
  const {
    complaint_status,
    neighborhood,
    complaint_type,
    description,
    location,
  } = req.body;

  const userRole = req.user?.role;
  try {
    const updatedComplaint = await prisma.complaints.update({
      where: { id: BigInt(id) }, // Changed from Number(id) to BigInt(id)
      data: {
        complaint_status,
        neighborhood,
        complaint_type,
        description,
        location,
      },
    });
    // Convert BigInt id to a string before sending response
    res.json(serializeComplaint(updatedComplaint));
  } catch (error) {
    // console.error("Error updating complaint:", error); // Added this line
    res.status(500).json({ error: "Failed to update complaint" });
  }
}

// Soft delete by mukhtar; hard delete by manager
export async function deleteComplaint(req: Request, res: Response) {
  const { id } = req.params;
  const userRole = req.user?.role;

  try {
    const complaint = await prisma.complaints.findUnique({
      where: { id: BigInt(id) }, // Changed from Number(id) to BigInt(id)
    });
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (userRole === "manager") {
      // Hard delete
      await prisma.complaints.delete({ where: { id: BigInt(id) } }); // Changed from Number(id) to BigInt(id)
      res.json({ message: "Complaint permanently deleted" });
    } else if (userRole === "mukhtar") {
      // Soft delete
      await prisma.complaints.update({
        where: { id: BigInt(id) }, // Changed from Number(id) to BigInt(id)
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
