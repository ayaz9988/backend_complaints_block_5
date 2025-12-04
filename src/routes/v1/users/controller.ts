import { Request, Response } from "express";
import prisma from "../../../prisma";
import bcrypt from "bcryptjs";

// Helper function to handle BigInt serialization for user objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const serializeUser = (user: any) => {
  return {
    ...user,
    id: user.id.toString(),
    // Convert complaintsHandled if it exists
    complaintsHandled: user.complaintsHandled
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        user.complaintsHandled.map((complaint: any) => ({
          ...complaint,
          id: complaint.id.toString(),
        }))
      : undefined,
  };
};

// Get users by role (for managers and admins)
export async function getUsersByRole(req: Request, res: Response) {
  const { role } = req.query;
  const userRole = req.user?.role;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    // If the requester is an admin, they can only see mukhtar users
    if (userRole === "admin") {
      whereClause.role = "mukhtar";
    }
    // If the requester is a manager, they can filter by role
    else if (userRole === "manager") {
      if (role === "admin") {
        whereClause.role = "admin";
      } else if (role === "mukhtar") {
        whereClause.role = "mukhtar";
      } else {
        // If no role is specified or role is "admin|mukhtar", return both
        whereClause.role = {
          in: ["admin", "mukhtar"],
        };
      }
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return res.json(users.map(serializeUser));
  } catch (error) {
    console.error("Error in getUsersByRole:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

// Get user by ID (for managers and admins)
export async function getUserById(req: Request, res: Response) {
  const { id } = req.params;
  const userRole = req.user?.role;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        complaintsHandled: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the requester has permission to view this user
    if (userRole === "manager") {
      // Manager can view any user
      return res.json(serializeUser(user));
    } else if (userRole === "admin" && user.role === "mukhtar") {
      // Admin can only view mukhtar users
      return res.json(serializeUser(user));
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch (error) {
    console.error("Error in getUserById:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
}

// Get complaints handled by a specific user
export async function getUserComplaints(req: Request, res: Response) {
  const { id } = req.params;
  const userRole = req.user?.role;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the requester has permission to view this user's complaints
    if (userRole === "manager") {
      // Manager can view any user's complaints
      const complaints = await prisma.complaints.findMany({
        where: { mukhtarInitialId: id },
      });

      return res.json(
        complaints.map((complaint) => ({
          ...complaint,
          id: complaint.id.toString(),
        })),
      );
    } else if (userRole === "admin" && user.role === "mukhtar") {
      // Admin can only view mukhtar's complaints
      const complaints = await prisma.complaints.findMany({
        where: { mukhtarInitialId: id },
      });

      return res.json(
        complaints.map((complaint) => ({
          ...complaint,
          id: complaint.id.toString(),
        })),
      );
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch (error) {
    console.error("Error in getUserComplaints:", error);
    res.status(500).json({ error: "Failed to fetch user complaints" });
  }
}

// Update user info (for managers and admins)
export async function updateUser(req: Request, res: Response) {
  const { id } = req.params;
  const { name, email, password, neighborhood } = req.body;
  const userRole = req.user?.role;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the requester has permission to update this user
    if (userRole === "manager") {
      // Manager can update any user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(password, salt);
      }
      if (neighborhood) updateData.neighborhood = neighborhood;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return res.json(serializeUser(updatedUser));
    } else if (userRole === "admin" && user.role === "mukhtar") {
      // Admin can only update mukhtar users (without password)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {};

      if (name) updateData.name = name;
      if (email) updateData.email = email;
      if (neighborhood) updateData.neighborhood = neighborhood;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      return res.json(serializeUser(updatedUser));
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
}

// Deactivate user (for managers and admins)
export async function deactivateUser(req: Request, res: Response) {
  const { id } = req.params;
  const userRole = req.user?.role;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the requester has permission to deactivate this user
    if (userRole === "manager") {
      // Manager can deactivate any user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { is_active: false },
      });

      return res.json(serializeUser(updatedUser));
    } else if (userRole === "admin" && user.role === "mukhtar") {
      // Admin can only deactivate mukhtar users
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { is_active: false },
      });

      return res.json(serializeUser(updatedUser));
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch (error) {
    console.error("Error in deactivateUser:", error);
    res.status(500).json({ error: "Failed to deactivate user" });
  }
}

// Delete user (for managers only)
export async function deleteUser(req: Request, res: Response) {
  const { id } = req.params;
  const userRole = req.user?.role;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only managers can delete users
    if (userRole === "manager") {
      // First, we need to handle all foreign key constraints

      // 1. Delete all refresh tokens for this user
      await prisma.refreshToken.deleteMany({
        where: { userId: id },
      });

      // 2. Update any complaints handled by this user to remove the reference
      await prisma.complaints.updateMany({
        where: { mukhtarInitialId: id },
        data: { mukhtarInitialId: null },
      });

      // 3. Update any announcements created by this user
      await prisma.announcement.updateMany({
        where: { createdBy: id },
        data: { createdBy: null },
      });

      // 4. Update any achievements created by this user
      await prisma.achievement.updateMany({
        where: { createdBy: id },
        data: { createdBy: null },
      });

      // Now we can safely delete the user
      await prisma.user.delete({
        where: { id },
      });

      return res.json({ message: "User deleted successfully" });
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
}
