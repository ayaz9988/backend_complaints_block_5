import dotenv from "dotenv";
dotenv.config();
import prisma from "../prisma";
import { hashPassword } from "../services/auth";

async function main() {
  const email = "admin@example.com";
  const pw = "ChangeMe123!";
  const hashed = await hashPassword(pw);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hashed, role: "admin" },
    create: { email, passwordHash: hashed, role: "admin" },
  });
  console.log("Admin seeded:", email);
}
main().finally(() => process.exit());
