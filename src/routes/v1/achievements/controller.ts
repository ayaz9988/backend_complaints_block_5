import { Request, Response } from "express";
import prisma from "../../../prisma";

// List all active achievements (public endpoint)
export async function listAchievements(req: Request, res: Response) {
  try {
    const achievements = await prisma.achievement.findMany({
      where: { status: "active" }, // Only show active achievements to the public
      orderBy: { createdAt: "desc" },
    });

    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
}

// Get a single active achievement by ID (public endpoint)
export async function getAchievement(req: Request, res: Response) {
  const { id } = req.params;
  try {
    const achievement = await prisma.achievement.findFirst({
      where: { id, status: "active" }, // Ensure it's active before showing
    });

    if (!achievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }

    res.json(achievement);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch achievement" });
  }
}

export async function createAchievement(req: Request, res: Response) {
  const { title, description, iconUrl, status = "active" } = req.body;
  // FIX: Use 'sub' instead of 'id' to get the user ID from the JWT payload
  const createdBy = req.user?.sub;

  if (!createdBy) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const creator = await prisma.user.findUnique({
      where: { id: createdBy },
    });

    if (!creator) {
      return res.status(401).json({ error: "Authenticated user not found." });
    }

    const newAchievement = await prisma.achievement.create({
      data: {
        title,
        description,
        iconUrl,
        status,
        createdBy,
      },
    });

    res.status(201).json(newAchievement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ error: "Failed to create achievement" });
  }
}

// Update an existing achievement (manager/admin only)
export async function updateAchievement(req: Request, res: Response) {
  const { id } = req.params;
  const { title, description, iconUrl, status } = req.body;

  try {
    const updatedAchievement = await prisma.achievement.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(iconUrl && { iconUrl }),
        ...(status && { status }),
      },
    });

    res.json(updatedAchievement);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Achievement not found" });
    }
    res.status(500).json({ error: "Failed to update achievement" });
  }
}

// Delete an achievement (manager/admin only)
export async function deleteAchievement(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await prisma.achievement.delete({
      where: { id },
    });

    res.status(204).send(); // 204 No Content is standard for successful deletions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Achievement not found" });
    }
    res.status(500).json({ error: "Failed to delete achievement" });
  }
}
