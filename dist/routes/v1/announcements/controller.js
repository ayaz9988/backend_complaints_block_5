"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAnnouncements = listAnnouncements;
exports.getAnnouncement = getAnnouncement;
exports.createAnnouncement = createAnnouncement;
exports.updateAnnouncement = updateAnnouncement;
exports.deleteAnnouncement = deleteAnnouncement;
const prisma_1 = __importDefault(require("../../../prisma"));
// List all active announcements (public endpoint)
async function listAnnouncements(req, res) {
  try {
    const announcements = await prisma_1.default.announcement.findMany({
      where: { status: "active" }, // Only show active announcements to the public
      orderBy: { createdAt: "desc" },
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
}
// Get a single active announcement by ID (public endpoint)
async function getAnnouncement(req, res) {
  const { id } = req.params;
  try {
    const announcement = await prisma_1.default.announcement.findFirst({
      where: { id, status: "active" }, // Ensure it's active before showing
    });
    if (!announcement) {
      return res.status(404).json({ error: "Announcement not found" });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch announcement" });
  }
}
// Create a new announcement (manager/admin only)
async function createAnnouncement(req, res) {
  const { title, content, status = "active" } = req.body;
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
      // If the user from the token doesn't exist in the DB, they are not a valid user.
      return res.status(401).json({ error: "Authenticated user not found." });
    }
    const newAnnouncement = await prisma_1.default.announcement.create({
      data: {
        title,
        content,
        status,
        createdBy,
      },
    });
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ error: "Failed to create announcement" });
  }
}
// Update an existing announcement (manager/admin only)
async function updateAnnouncement(req, res) {
  const { id } = req.params;
  const { title, content, status } = req.body;
  try {
    const updatedAnnouncement = await prisma_1.default.announcement.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(status && { status }),
      },
    });
    res.json(updatedAnnouncement);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error) {
    // Handle case where announcement to update doesn't exist
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Announcement not found" });
    }
    res.status(500).json({ error: "Failed to update announcement" });
  }
}
// Delete an announcement (manager/admin only)
async function deleteAnnouncement(req, res) {
  const { id } = req.params;
  try {
    await prisma_1.default.announcement.delete({
      where: { id },
    });
    res.status(204).send(); // 204 No Content is standard for successful deletions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Announcement not found" });
    }
    res.status(500).json({ error: "Failed to delete announcement" });
  }
}
