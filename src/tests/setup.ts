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

import prisma from "../prisma";

beforeEach(async () => {
  await prisma.$transaction(async (prisma) => {
    // Delete dependent child records first (e.g., refresh tokens linked to users)
    await prisma.refreshToken.deleteMany({});

    // Then delete parent records (e.g., users)
    await prisma.user.deleteMany({});

    // Add other deletions if needed, doing children first then parents
    // await prisma.complaints.deleteMany({});
  });
});

// This runs AFTER ALL tests are done
afterAll(async () => {
  // Close the database connection to avoid hanging connections
  await prisma.$disconnect();
});
