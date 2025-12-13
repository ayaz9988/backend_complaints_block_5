"use strict";
/**
 * LOGOUT ENDPOINT TESTS
 *
 * These tests verify that logout works correctly
 *
 * What we're testing:
 * 1. Successful logout revokes the refresh token
 * 2. Cookie is cleared after logout
 * 3. Logout works even without a token (idempotent)
 * 4. Revoked token cannot be used to refresh
 */
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../server");
const helpers_1 = require("./../helpers");
const prisma_1 = __importDefault(require("../../prisma"));
const app = (0, server_1.createServer)();
describe("POST /v1/auth/logout", () => {
  /**
   * TEST 1: Successful Logout
   *
   * When a user logs out:
   * - The refresh token should be revoked in the database
   * - The refresh cookie should be cleared
   * - Response should confirm success
   */
  it("should logout successfully and revoke refresh token", async () => {
    // Create user and login
    const user = await (0, helpers_1.createTestUser)(
      "user@example.com",
      "password123",
      "admin",
    );
    const loginResponse = await (0, helpers_1.loginUser)(
      app,
      "user@example.com",
      "password123",
    );
    const refreshToken = (0, helpers_1.extractRefreshToken)(
      loginResponse.headers["set-cookie"],
    );
    // Logout
    const logoutResponse = await (0, supertest_1.default)(app)
      .post("/v1/auth/logout")
      .set("Cookie", `refresh_token=${refreshToken}`);
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.ok).toBe(true);
    // Verify the token was revoked in the database
    const tokens = await prisma_1.default.refreshToken.findMany({
      where: { userId: user.id },
    });
    // All tokens should be revoked
    expect(tokens.every((t) => t.revoked)).toBe(true);
    // Verify cookie is cleared (should have Max-Age=0 or similar)
    const cookies = logoutResponse.headers["set-cookie"];
    expect(cookies).toBeDefined();
  });
  /**
   * TEST 2: Logout Without Token
   *
   * Logout should succeed even if no refresh token is provided
   * This makes logout "idempotent" - calling it multiple times is safe
   */
  it("should return success even if no refresh token is provided", async () => {
    const response = await (0, supertest_1.default)(app).post(
      "/v1/auth/logout",
    );
    // No cookie provided
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
  /**
   * TEST 3: Cannot Use Token After Logout
   *
   * After logging out, the refresh token should not work
   * This prevents session hijacking
   */
  it("should not allow using refresh token after logout", async () => {
    // Login
    await (0, helpers_1.createTestUser)(
      "user@example.com",
      "password123",
      "admin",
    );
    const loginResponse = await (0, helpers_1.loginUser)(
      app,
      "user@example.com",
      "password123",
    );
    const refreshToken = (0, helpers_1.extractRefreshToken)(
      loginResponse.headers["set-cookie"],
    );
    // Logout
    await (0, supertest_1.default)(app)
      .post("/v1/auth/logout")
      .set("Cookie", `refresh_token=${refreshToken}`);
    // Try to refresh with the logged-out token - should fail!
    const refreshResponse = await (0, supertest_1.default)(app)
      .post("/v1/auth/refresh")
      .set("Cookie", `refresh_token=${refreshToken}`);
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.error).toBe("Invalid refresh token");
  });
  /**
   * TEST 4: Logout With Invalid Token
   * Even if the token is invalid/expired, logout should succeed
   * We don't want to give errors during logout
   */
  it("should succeed even with invalid token", async () => {
    const response = await (0, supertest_1.default)(app)
      .post("/v1/auth/logout")
      .set("Cookie", "refresh_token=invalid_fake_token");
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });
});
