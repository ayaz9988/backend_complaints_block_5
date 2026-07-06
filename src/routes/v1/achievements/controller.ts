import { Request, Response, NextFunction } from "express";
import prisma from "../../../prisma";
import logger from "../../../lib/logger";
import { getMediaType, getMediaUrl, deleteMedia } from "../../../lib/upload";

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
  const id = req.params.id as string;
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

export async function createAchievement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // File upload is now handled by middleware in the route
  await handleCreateAchievement(req, res);
}

async function handleCreateAchievement(req: Request, res: Response) {
  const { title, description, status = "active" } = req.body;
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

    // Handle uploaded file
    let mediaUrl: string | undefined;
    let mediaType: string | undefined;

    if (req.file) {
      mediaUrl = getMediaUrl(req.file.filename);
      const type = getMediaType(req.file.mimetype);
      if (type) {
        mediaType = type;
      }
    }

    const newAchievement = await prisma.achievement.create({
      data: {
        title,
        description,
        mediaUrl,
        mediaType,
        status,
        createdBy,
      },
    });

    res.status(201).json(newAchievement);
  } catch (error) {
    logger.error({ err: error }, "Error creating achievement");
    res.status(500).json({ error: "Failed to create achievement" });
  }
}

// Update an existing achievement (manager/admin only)
export async function updateAchievement(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // File upload is now handled by middleware in the route
  await handleUpdateAchievement(req, res);
}

async function handleUpdateAchievement(req: Request, res: Response) {
  const id = req.params.id as string;
  const { title, description, status } = req.body;

  try {
    // Get existing achievement to check if there's an old media file
    const existingAchievement = await prisma.achievement.findUnique({
      where: { id },
    });

    if (!existingAchievement) {
      return res.status(404).json({ error: "Achievement not found" });
    }

    // Handle new uploaded file
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mediaUrl: any = existingAchievement.mediaUrl;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mediaType: any = existingAchievement.mediaType;

    if (req.file) {
      // Delete old media file if exists
      if (existingAchievement.mediaUrl) {
        await deleteMedia(existingAchievement.mediaUrl);
      }
      mediaUrl = getMediaUrl(req.file.filename);
      const type = getMediaType(req.file.mimetype);
      if (type) {
        mediaType = type;
      }
    }

    // If mediaUrl is explicitly set to null or empty string in the request, remove the media
    if (req.body.mediaUrl === null || req.body.mediaUrl === "") {
      if (existingAchievement.mediaUrl) {
        await deleteMedia(existingAchievement.mediaUrl);
      }
      mediaUrl = null;
      mediaType = null;
    }

    const updatedAchievement = await prisma.achievement.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(mediaUrl !== undefined && { mediaUrl }),
        ...(mediaType !== undefined && { mediaType }),
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
  const id = req.params.id as string;

  try {
    // Get existing achievement to delete associated media file
    const existingAchievement = await prisma.achievement.findUnique({
      where: { id },
    });

    if (existingAchievement?.mediaUrl) {
      await deleteMedia(existingAchievement.mediaUrl);
    }

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
