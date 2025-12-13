"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAchievements = listAchievements;
exports.getAchievement = getAchievement;
exports.createAchievement = createAchievement;
exports.updateAchievement = updateAchievement;
exports.deleteAchievement = deleteAchievement;
const prisma_1 = __importDefault(require("../../../prisma"));
// List all active achievements (public endpoint)
async function listAchievements(req, res) {
  try {
    const achievements = await prisma_1.default.achievement.findMany({
      where: { status: "active" }, // Only show active achievements to the public
      orderBy: { createdAt: "desc" },
    });
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
}
// Get a single active achievement by ID (public endpoint)
async function getAchievement(req, res) {
  const { id } = req.params;
  try {
    const achievement = await prisma_1.default.achievement.findFirst({
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
async function createAchievement(req, res) {
  const { title, description, iconUrl, status = "active" } = req.body;
  // FIX: Use 'sub' instead of 'id' to get the user ID from the JWT payload
  const createdBy = req.user?.sub;
  if (!createdBy) {
    return res.status(401).json({ error: "User not authenticated" });
  }
  try {
    const creator = await prisma_1.default.user.findUnique({
      where: { id: createdBy },
    });
    if (!creator) {
      return res.status(401).json({ error: "Authenticated user not found." });
    }
    const newAchievement = await prisma_1.default.achievement.create({
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
async function updateAchievement(req, res) {
  const { id } = req.params;
  const { title, description, iconUrl, status } = req.body;
  try {
    const updatedAchievement = await prisma_1.default.achievement.update({
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
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Achievement not found" });
    }
    res.status(500).json({ error: "Failed to update achievement" });
  }
}
// Delete an achievement (manager/admin only)
async function deleteAchievement(req, res) {
  const { id } = req.params;
  try {
    await prisma_1.default.achievement.delete({
      where: { id },
    });
    res.status(204).send(); // 204 No Content is standard for successful deletions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Achievement not found" });
    }
    res.status(500).json({ error: "Failed to delete achievement" });
  }
}
