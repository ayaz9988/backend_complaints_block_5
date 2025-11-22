"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../services/auth");
async function main() {
    const email = "admin@example.com";
    const pw = "ChangeMe123!";
    const hashed = await (0, auth_1.hashPassword)(pw);
    await prisma_1.default.user.upsert({
        where: { email },
        update: { passwordHash: hashed, role: "admin" },
        create: { email, passwordHash: hashed, role: "admin" },
    });
    console.log("Admin seeded:", email);
}
main().finally(() => process.exit());
