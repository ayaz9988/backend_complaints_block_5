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
 * 6. Prevent login for inactive users
 */

import request from "supertest";
import { createServer } from "../../server";
import { createTestUser } from "./../helpers";

const app = createServer();

describe("POST /v1/auth/login", () => {
  it("should login successfully with correct credentials", async () => {
    await createTestUser(
      "user@example.com",
      "password123",
      "admin",
      true,
      "User Name",
    );

    const response = await request(app).post("/v1/auth/login").send({
      email: "user@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("expiresIn");
    expect(response.body.user).toMatchObject({
      name: "User Name",
      email: "user@example.com",
      role: "admin",
    });

    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();

    const cookieArray = Array.isArray(cookies)
      ? cookies
      : cookies
        ? [cookies]
        : [];
    const refreshCookie = cookieArray.find((c: string) =>
      c.startsWith("refresh_token="),
    );
    expect(refreshCookie).toBeDefined();

    // Check cookie contains HttpOnly and SameSite attributes correctly (case-insensitive)
    expect(refreshCookie.toLowerCase()).toContain("httponly");
    expect(refreshCookie.toLowerCase()).toContain("samesite=lax");
  });

  it("should return 401 for wrong password", async () => {
    await createTestUser(
      "user@example.com",
      "correct_password",
      "admin",
      true,
      "User Name",
    );

    const response = await request(app).post("/v1/auth/login").send({
      email: "user@example.com",
      password: "wrong_password",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials");
    expect(response.body).not.toHaveProperty("accessToken");
  });

  it("should return 401 for non-existent user", async () => {
    const response = await request(app).post("/v1/auth/login").send({
      email: "nonexistent@example.com",
      password: "anypassword",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials or inactive user");
  });

  it("should return 400 if email is missing", async () => {
    const response = await request(app).post("/v1/auth/login").send({
      password: "password123",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toHaveProperty("message", "Validation failed");
    expect(response.body.error).toHaveProperty("details");
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "body.email",
          message: "Required",
          code: "invalid_type",
        }),
      ]),
    );
  });

  it("should return 400 if password is missing", async () => {
    const response = await request(app).post("/v1/auth/login").send({
      email: "user@example.com",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toHaveProperty("message", "Validation failed");
    expect(response.body.error).toHaveProperty("details");
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "body.password",
          message: "Required",
          code: "invalid_type",
        }),
      ]),
    );
  });

  it("should never return password or password hash", async () => {
    await createTestUser(
      "user@example.com",
      "password123",
      "admin",
      true,
      "User Name",
    );

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

  it("should return 401 for inactive user", async () => {
    // Create user with is_active false
    await createTestUser(
      "inactive@example.com",
      "password123",
      "admin",
      false,
      "Inactive User",
    );

    const response = await request(app).post("/v1/auth/login").send({
      email: "inactive@example.com",
      password: "password123",
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Invalid credentials or inactive user");
  });
});
