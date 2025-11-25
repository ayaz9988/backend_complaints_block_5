/**
 * TOKEN REFRESH ENDPOINT TESTS
 *
 * These tests verify that token refresh works correctly
 *
 * What we're testing:
 * 1. Successful token refresh with valid cookie
 * 2. Token rotation (old token is revoked, new token is issued)
 * 3. Invalid/missing refresh token handling
 * 4. Expired token handling
 * 5. Revoked token handling
 */

import request from "supertest";
import { createServer } from "../../server";
import { createTestUser, loginUser, extractRefreshToken } from "./../helpers";
import prisma from "../../prisma";
import { signRefreshToken } from "../../lib/jwt";
import config from "../../config";
import { createRefreshToken, makeExpiryDate } from "../../services/auth";
import { sub } from "date-fns";

const app = createServer();

describe("POST /v1/auth/refresh", () => {
  /**
   * TEST 1: Successful Token Refresh
   *
   * When a valid refresh token is provided:
   * - We should get a new access token
   * - We should get a new refresh token cookie
   * - The old refresh token should be revoked (token rotation)
   */
  it("should refresh tokens successfully with valid refresh cookie", async () => {
    // Create a user and login to get tokens
    await createTestUser("user@example.com", "password123", "admin");
    const loginResponse = await loginUser(
      app,
      "user@example.com",
      "password123",
    );

    // Extract the refresh token from the cookie
    const refreshToken = extractRefreshToken(
      loginResponse.headers["set-cookie"],
    );
    expect(refreshToken).toBeDefined();

    // Now use the refresh token to get new tokens
    const refreshResponse = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", `refresh_token=${refreshToken}`); // Send the cookie!

    // Verify we got new tokens
    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toHaveProperty("accessToken");
    expect(refreshResponse.body.user.email).toBe("user@example.com");

    // Verify a new refresh token cookie was set
    const newRefreshToken = extractRefreshToken(
      refreshResponse.headers["set-cookie"],
    );
    expect(newRefreshToken).toBeDefined();
    expect(newRefreshToken).not.toBe(refreshToken); // Should be a NEW token!

    // Verify the old token was revoked in the database
    const user = await prisma.user.findUnique({
      where: { email: "user@example.com" },
      include: { refreshTokens: true },
    });

    // At least one token should be revoked (the old one)
    const revokedTokens = user?.refreshTokens.filter((t) => t.revoked);
    expect(revokedTokens?.length).toBeGreaterThan(0);
  });

  /**
   * TEST 2: No Refresh Token
   *
   * When no refresh token is provided:
   * - We should get a 401 status
   * - Clear error message
   */
  it("should return 401 if no refresh token is provided", async () => {
    const response = await request(app).post("/v1/auth/refresh");
    // No cookie sent!

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("No refresh token");
  });

  /**
   * TEST 3: Invalid Refresh Token
   *
   * When an invalid (fake) refresh token is provided:
   * - We should get a 401 status
   * - No new tokens should be issued
   */
  it("should return 401 for invalid refresh token", async () => {
    const response = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", "refresh_token=invalid_fake_token_12345");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid token");
  });

  /**
   * TEST 4: Revoked Refresh Token
   *
   * When a refresh token has been revoked:
   * - We should get a 401 status
   * - This prevents token reuse after logout
   */
  it("should return 401 for revoked refresh token", async () => {
    // Create user and login
    const user = await createTestUser(
      "user@example.com",
      "password123",
      "admin",
    );
    const loginResponse = await loginUser(
      app,
      "user@example.com",
      "password123",
    );
    const refreshToken = extractRefreshToken(
      loginResponse.headers["set-cookie"],
    );

    // Manually revoke the token in the database
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revoked: false },
      data: { revoked: true },
    });

    // Try to use the revoked token
    const response = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", `refresh_token=${refreshToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid refresh token");
  });

  /**
   * TEST 5: Expired Refresh Token
   *
   * When a refresh token has expired:
   * - We should get a 401 status
   * - User must login again
   */
  it("should return 401 for expired refresh token", async () => {
    // Create user
    const user = await createTestUser(
      "user@example.com",
      "password123",
      "admin",
    );

    // Create an expired refresh token (set expiry to yesterday)
    const expiredToken = signRefreshToken(
      { sub: user.id },
      config.REFRESH_SECRET,
      "1d",
    );

    // Save it with an expired date
    const yesterday = sub(new Date(), { days: 1 });
    await createRefreshToken(user.id, expiredToken, yesterday);

    // Try to use the expired token
    const response = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", `refresh_token=${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid refresh token");
  });

  /**
   * TEST 6: Token Rotation
   *
   * This is a security feature!
   * After refreshing, the old token should no longer work
   */
  it("should not allow reusing old refresh token after rotation", async () => {
    // Create user and login
    await createTestUser("user@example.com", "password123", "admin");
    const loginResponse = await loginUser(
      app,
      "user@example.com",
      "password123",
    );
    const oldToken = extractRefreshToken(loginResponse.headers["set-cookie"]);

    // Refresh once
    await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", `refresh_token=${oldToken}`);

    // Try to use the old token again - should fail!
    const secondRefreshResponse = await request(app)
      .post("/v1/auth/refresh")
      .set("Cookie", `refresh_token=${oldToken}`);

    expect(secondRefreshResponse.status).toBe(401);
  });
});
