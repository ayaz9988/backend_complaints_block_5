"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInitiative = createInitiative;
exports.listInitiatives = listInitiatives;
exports.getInitiative = getInitiative;
exports.updateInitiative = updateInitiative;
exports.deleteInitiative = deleteInitiative;
const prisma_1 = __importDefault(require("../../../prisma"));
/**
 * Helper function to handle BigInt serialization for initiative objects.
 * JavaScript's native JSON.stringify() cannot handle BigInt values.
 * This function converts BigInt id to a string.
 * @param initiative - The initiative object from Prisma
 * @returns A new initiative object with a stringified id
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeInitiative = (initiative) => {
  return {
    ...initiative,
    id: initiative.id.toString(),
  };
};
async function createInitiative(req, res) {
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
    const newInitiative = await prisma_1.default.initiative.create({
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
async function listInitiatives(req, res) {
  try {
    const initiatives = await prisma_1.default.initiative.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(initiatives.map(serializeInitiative));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch initiatives" });
  }
}
async function getInitiative(req, res) {
  const { id } = req.params;
  try {
    const initiative = await prisma_1.default.initiative.findUnique({
      where: { id: BigInt(id) },
    });
    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }
    res.json(serializeInitiative(initiative));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch initiative" });
  }
}
async function updateInitiative(req, res) {
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
    const currentInitiative = await prisma_1.default.initiative.findUnique({
      where: { id: BigInt(id) },
    });
    if (!currentInitiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status && ["pending", "approved", "rejected"].includes(status))
      updateData.status = status;
    if (submitterName !== undefined) updateData.submitterName = submitterName;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (location !== undefined) updateData.location = location;
    if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
    const updatedInitiative = await prisma_1.default.initiative.update({
      where: { id: BigInt(id) },
      data: updateData,
    });
    res.json(serializeInitiative(updatedInitiative));
  } catch (error) {
    res.status(500).json({ error: "Failed to update initiative" });
  }
}
async function deleteInitiative(req, res) {
  const { id } = req.params;
  try {
    const initiative = await prisma_1.default.initiative.findUnique({
      where: { id: BigInt(id) },
    });
    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }
    await prisma_1.default.initiative.delete({ where: { id: BigInt(id) } });
    res.json({ message: "Initiative deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete initiative" });
  }
}
