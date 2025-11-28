import dotenv from "dotenv";
dotenv.config();
import prisma from "../prisma";
import { hashPassword } from "../services/auth";

async function main() {
  try {
    const email = "manager@example.com";
    const password = "ChangeMe123!";
    const name = "System Manager";
    const role = "manager";
    const isActive = true;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role,
          name,
          is_active: isActive,
        },
      });
      console.log(`Manager user updated: ${email}`);
    } else {
      // Create new user
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role,
          name,
          is_active: isActive,
        },
      });
      console.log(`Manager user created: ${email}`);
    }

    console.log("Super user (manager) seeded successfully!");
  } catch (error) {
    console.error("Error seeding manager user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

main();
