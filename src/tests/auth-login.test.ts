/**
 * LOGIN ENDPOINT TESTS
 *
 * These tests verify that user login works correctly
 *
 * What we're testing:
 * 1. Successful login with correct credentials
 * 2. Failed login with wrong password
 * 3. Failed login with non-existent user
 * 4. Response contains access token and refresh cookie
 * 5. Cookie security attributes (httpOnly, sameSite)
 */

import request from "supertest";
import { createServer } from "../server";
import { createTestUser } from "./helpers";

const app = createServer();

describe("POST /v1/auth/login", () => {
  /**
   * TEST 1: Successful Login
   *
   * When a user logs in with correct credentials:
   * - We should get a 200 status
   * - Response should contain accessToken and user info
   * - A refresh token cookie should be set
   */
  it("should login successfully with correct credentials", async () => {
    // First, create a user
    await createTestUser("user@example.com", "password123", "admin");

    // Now try to login
    const response = await request(app).post("/v1/auth/login").send({
      email: "user@example.com",
      password: "password123",
    });

    // Check the response
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("expiresIn");
    expect(response.body.user).toMatchObject({
      email: "user@example.com",
      role: "admin",
    });

    // Verify refresh token cookie is set
    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();

    // Convert to array and find the refresh_token cookie
    const cookieArray = Array.isArray(cookies)
      ? cookies
      : cookies
        ? [cookies]
        : [];
    const refreshCookie = cookieArray.find((c: string) =>
      c.startsWith("refresh_token="),
    );
    expect(refreshCookie).toBeDefined();

    // Verify cookie security attributes
    expect(refreshCookie).toContain("HttpOnly"); // Prevents JavaScript access (XSS protection)
    expect(refreshCookie).toContain("SameSite=Lax"); // CSRF protection
  });

  /**
   * TEST 2: Wrong Password
   *
   * When a user provides the wrong password:
   * - We should get a 401 status (Unauthorized)
   * - No tokens should be returned
   * - Generic error message (don't reveal if email exists)
   */
  it("should return 401 for wrong password", async () => {
    await createTestUser("user@example.com", "correct_password", "admin");

    const response = await request(app).post("/v1/auth/login").send({
      email: "user@example.com",
      password: "wrong_password", // Wrong password!
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials");
    expect(response.body).not.toHaveProperty("accessToken");
  });

  /**
   * TEST 3: Non-existent User
   *
   * When trying to login with an email that doesn't exist:
   * - We should get a 401 status
   * - Same generic error message (security best practice)
   */
  it("should return 401 for non-existent user", async () => {
    const response = await request(app).post("/v1/auth/login").send({
      email: "nonexistent@example.com", // This user doesn't exist
      password: "anypassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials");
  });

  /**
   * TEST 4: Missing Credentials
   *
   * When required fields are missing:
   * - We should get a 400 status (Bad Request)
   * - Clear error message
   */
  it("should return 400 if email is missing", async () => {
    const response = await request(app).post("/v1/auth/login").send({
      // email is missing
      password: "password123",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing credentials");
  });

  it("should return 400 if password is missing", async () => {
    const response = await request(app).post("/v1/auth/login").send({
      email: "user@example.com",
      // password is missing
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing credentials");
  });

  /**
   * TEST 5: Password Security
   *
   * Verify that the password is never returned in the response
   * This is a critical security check!
   */
  it("should never return password or password hash", async () => {
    await createTestUser("user@example.com", "password123", "admin");

    const response = await request(app).post("/v1/auth/login").send({
      email: "user@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
    expect(response.body.user).not.toHaveProperty("password");
    expect(response.body.user).not.toHaveProperty("passwordHash");
  });
});
