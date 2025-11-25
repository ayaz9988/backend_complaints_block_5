/**
 * AUTH SERVICE UNIT TESTS
 *
 * These are "unit tests" - they test individual functions in isolation
 * Unlike integration tests (which test full API flows), these test just the logic
 */

import {
  hashPassword,
  verifyPassword,
  hashRefreshToken,
  createRefreshToken,
  findValidRefreshToken,
  revokeRefreshToken,
  makeExpiryDate,
} from "../../services/auth";
import { createTestUser } from "../helpers";
import prisma from "../../prisma";
import { add, sub } from "date-fns";
import { signRefreshToken } from "../../lib/jwt";

// Import dotenv config once to load environment variables for tests
import "dotenv/config";

describe("Auth Service - Password Functions", () => {
  // Clean DB before each test
  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it("should hash passwords correctly", async () => {
    const password = "MySecurePassword123";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[ab]\$/);

    const hash2 = await hashPassword(password);
    expect(hash2).not.toBe(hash);
  });

  it("should verify correct password", async () => {
    const password = "MySecurePassword123";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect password", async () => {
    const password = "MySecurePassword123";
    const hash = await hashPassword(password);
    const isValid = await verifyPassword("WrongPassword", hash);
    expect(isValid).toBe(false);
  });
});

describe("Auth Service - Refresh Token Functions", () => {
  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it("should hash refresh tokens", async () => {
    const token = "sample_refresh_token_12345";
    const hash = await hashRefreshToken(token);
    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  it("should create and store refresh token in database", async () => {
    const user = await createTestUser(
      `user_${Date.now()}@example.com`,
      "password123",
      "admin",
    );

    // Use signRefreshToken to generate valid token with jti and secret from env var
    const token = signRefreshToken(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET!,
      "7d",
    );
    const expiresAt = makeExpiryDate(30);

    const result = await createRefreshToken(user.id, token, expiresAt);

    expect(result.userId).toBe(user.id);
    expect(result.token).not.toBe(token); // Should be hashed!
    expect(result.expiresAt).toEqual(expiresAt);
    expect(result.revoked).toBe(false);
    expect(result.jti).toBeDefined();
  });

  it("should find valid refresh token", async () => {
    const user = await createTestUser(
      `user_${Date.now()}@example.com`,
      "password123",
      "admin",
    );

    const token = signRefreshToken(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET!,
      "7d",
    );
    const expiresAt = makeExpiryDate(30);
    await createRefreshToken(user.id, token, expiresAt);

    const found = await findValidRefreshToken(user.id, token);
    expect(found).not.toBeNull();
    expect(found?.userId).toBe(user.id);
  });

  it("should not find revoked refresh token", async () => {
    const user = await createTestUser(
      `user_${Date.now()}@example.com`,
      "password123",
      "admin",
    );

    const token = signRefreshToken(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET!,
      "7d",
    );
    const expiresAt = makeExpiryDate(30);
    await createRefreshToken(user.id, token, expiresAt);

    // Revoke the token
    await revokeRefreshToken(user.id, token);

    // Should not find revoked token
    const found = await findValidRefreshToken(user.id, token);
    expect(found).toBeNull();
  });

  it("should not find expired refresh token", async () => {
    const user = await createTestUser(
      `user_${Date.now()}@example.com`,
      "password123",
      "admin",
    );

    const token = signRefreshToken(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET!,
      "7d",
    );
    const yesterday = sub(new Date(), { days: 1 });
    await createRefreshToken(user.id, token, yesterday);

    const found = await findValidRefreshToken(user.id, token);
    expect(found).toBeNull();
  });

  it("should revoke refresh token", async () => {
    const user = await createTestUser(
      `user_${Date.now()}@example.com`,
      "password123",
      "admin",
    );

    const token = signRefreshToken(
      { sub: user.id },
      process.env.JWT_REFRESH_SECRET!,
      "7d",
    );
    const expiresAt = makeExpiryDate(30);
    await createRefreshToken(user.id, token, expiresAt);

    const result = await revokeRefreshToken(user.id, token);
    expect(result).not.toBeNull();

    const tokens = await prisma.refreshToken.findMany({
      where: { userId: user.id },
    });
    expect(tokens[0].revoked).toBe(true);
  });

  it("should create correct expiry date", () => {
    const days = 30;
    const expiryDate = makeExpiryDate(days);
    const expectedDate = add(new Date(), { days: 30 });
    const diff = Math.abs(expiryDate.getTime() - expectedDate.getTime());
    expect(diff).toBeLessThan(1000);
  });
});
