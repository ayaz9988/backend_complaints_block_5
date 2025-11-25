import { Request, Response } from "express";
import prisma from "../../../prisma";

export async function listComplaints(req: Request, res: Response) {
  try {
    const complaints = await prisma.complaints.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
}

export async function getComplaint(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const complaint = await prisma.complaints.findFirst({
      where: { id: Number(id), deletedAt: null },
    });
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    res.json(complaint);
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
    res.status(201).json(newComplaint);
  } catch (error) {
    res.status(500).json({ error: "Failed to create complaint" });
  }
}

// Only manager can update complaint status and flat fields
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
      where: { id: Number(id) },
      data: {
        complaint_status,
        neighborhood,
        complaint_type,
        description,
        location,
      },
    });
    res.json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ error: "Failed to update complaint" });
  }
}

// Soft delete by mukhtar; hard delete by manager
export async function deleteComplaint(req: Request, res: Response) {
  const { id } = req.params;
  const userRole = req.user?.role;

  try {
    const complaint = await prisma.complaints.findUnique({
      where: { id: Number(id) },
    });
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (userRole === "manager") {
      // Hard delete
      await prisma.complaints.delete({ where: { id: Number(id) } });
      res.json({ message: "Complaint permanently deleted" });
    } else if (userRole === "mukhtar") {
      // Soft delete
      await prisma.complaints.update({
        where: { id: Number(id) },
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
