import dotenv from "dotenv";
dotenv.config();
import prisma from "../prisma";
import { hashPassword } from "../services/auth";

async function main() {
  try {
    const email = "admin@example.com";
    const password = "ChangeMe123!";
    const name = "System Administrator";
    const role = "manager";
    const isActive = true;

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // Update existing user
      await prisma.user.update({
        where: { email },
        data: {
          passwordHash,
          role,
          name,
          is_active: isActive
        }
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
          is_active: isActive
        }
      });
      console.log(`Admin user created: ${email}`);
    }

    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding admin user:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

main();