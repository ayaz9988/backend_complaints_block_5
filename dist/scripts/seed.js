"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../services/auth");
async function main() {
  try {
    const email = "manager@example.com";
    const password = "ChangeMe123!";
    const name = "System Manager";
    const role = "manager";
    const isActive = true;
    // Hash password
    const passwordHash = await (0, auth_1.hashPassword)(password);
    // Check if user already exists
    const existingUser = await prisma_1.default.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      // Update existing user
      await prisma_1.default.user.update({
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
      await prisma_1.default.user.create({
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
    await prisma_1.default.$disconnect();
    process.exit();
  }
}
main();
