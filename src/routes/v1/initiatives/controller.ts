import { Request, Response } from "express";
import prisma from "../../../prisma";

/**
 * Helper function to handle serialization for initiative objects.
 * @param initiative - The initiative object from Prisma
 * @returns A new initiative object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeInitiative = (initiative: any) => {
  return {
    ...initiative,
  };
};

export async function createInitiative(req: Request, res: Response) {
  const {
    title,
    description,
    submitterName,
    contactNumber,
    location,
    neighborhood,
  } = req.body;

  if (!title || !description) {
    return res
      .status(400)
      .json({ error: "Title and description are required" });
  }

  try {
    const newInitiative = await prisma.initiative.create({
      data: {
        title,
        description,
        submitterName,
        contactNumber,
        location,
        neighborhood,
      },
    });

    res.status(201).json(serializeInitiative(newInitiative));
  } catch (error) {
    res.status(500).json({
      error: "Failed to create initiative",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function listInitiatives(req: Request, res: Response) {
  try {
    const initiatives = await prisma.initiative.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(initiatives.map(serializeInitiative));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch initiatives" });
  }
}

export async function getInitiative(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id: id },
    });
    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }
    res.json(serializeInitiative(initiative));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch initiative" });
  }
}

export async function updateInitiative(req: Request, res: Response) {
  const { id } = req.params;
  const {
    title,
    description,
    status,
    submitterName,
    contactNumber,
    location,
    neighborhood,
  } = req.body;

  try {
    const currentInitiative = await prisma.initiative.findUnique({
      where: { id: id },
    });

    if (!currentInitiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status && ["pending", "approved", "rejected"].includes(status))
      updateData.status = status;
    if (submitterName !== undefined) updateData.submitterName = submitterName;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (location !== undefined) updateData.location = location;
    if (neighborhood !== undefined) updateData.neighborhood = neighborhood;

    const updatedInitiative = await prisma.initiative.update({
      where: { id: id },
      data: updateData,
    });

    res.json(serializeInitiative(updatedInitiative));
  } catch (error) {
    res.status(500).json({ error: "Failed to update initiative" });
  }
}

export async function deleteInitiative(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id: id },
    });
    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }

    await prisma.initiative.delete({ where: { id: id } });
    res.json({ message: "Initiative deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete initiative" });
  }
}

export async function approveInitiative(req: Request, res: Response) {
  const { id } = req.params;

  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id: id },
    });

    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }

    // Check if already approved
    if (initiative.status === "approved") {
      return res.status(400).json({ error: "Initiative is already approved" });
    }

    const updatedInitiative = await prisma.initiative.update({
      where: { id: id },
      data: {
        status: "approved",
        rejectionReason: null, // Clear any previous rejection reason
      },
    });

    res.json(serializeInitiative(updatedInitiative));
  } catch (error) {
    res.status(500).json({ error: "Failed to approve initiative" });
  }
}

export async function rejectInitiative(req: Request, res: Response) {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    return res.status(400).json({ error: "Rejection reason is required" });
  }

  try {
    const initiative = await prisma.initiative.findUnique({
      where: { id: id },
    });

    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }

    // Check if already rejected
    if (initiative.status === "rejected") {
      return res.status(400).json({ error: "Initiative is already rejected" });
    }

    const updatedInitiative = await prisma.initiative.update({
      where: { id: id },
      data: {
        status: "rejected",
        rejectionReason,
      },
    });

    res.json(serializeInitiative(updatedInitiative));
  } catch (error) {
    res.status(500).json({ error: "Failed to reject initiative" });
  }
}
