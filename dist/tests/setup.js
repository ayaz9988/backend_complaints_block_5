"use strict";
/**
 * TEST SETUP FILE
 *
 * This file runs BEFORE all tests to set up the testing environment
 *
 * What it does:
 * 1. Clears the test database before each test
 * 2. Closes database connections after all tests
 * 3. Sets up environment variables for testing
 */
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../prisma"));
beforeEach(async () => {
  await prisma_1.default.$transaction(async (prisma) => {
    // Delete dependent child records first (e.g., refresh tokens linked to users)
    await prisma.refreshToken.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.achievement.deleteMany({});
    // Delete complaints before users since they might have foreign key relationships
    await prisma.complaints.deleteMany({});
    // Then delete parent records (e.g., users)
    await prisma.user.deleteMany({});
    // Add other deletions if needed, doing children first then parents
  });
});
// This runs AFTER ALL tests are done
afterAll(async () => {
  // Close the database connection to avoid hanging connections
  await prisma_1.default.$disconnect();
});
