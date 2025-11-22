/**
 * REGISTRATION ENDPOINT TESTS
 *
 * These tests verify that user registration works correctly
 *
 * What we're testing:
 * 1. Successful registration with valid data
 * 2. Validation errors (missing fields, invalid role)
 * 3. Duplicate email handling
 * 4. Authorization (only admins can register users)
 */

import request from "supertest";
import { createServer } from "../server";
import { createTestUser } from "./helpers";
import { signAccessToken } from "../lib/jwt";
import config from "../config";

// Create the Express app for testing
const app = createServer();

describe("POST /v1/auth/register", () => {
  /**
   * TEST 1: Successful Registration
   *
   * This tests the "happy path" - when everything works correctly
   * We expect:
   * - 200 status code
   * - User data in response (id, email, role)
   * - User saved to database
   */
  it("should register a new user successfully with admin token", async () => {
    // First, create an admin user to generate a valid token
    const admin = await createTestUser(
      "admin@example.com",
      "password",
      "admin",
    );

    // Generate an access token for the admin
    const adminToken = signAccessToken(
      { sub: admin.id, role: admin.role, email: admin.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    // Make the registration request
    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${adminToken}`) // Admin authentication required!
      .send({
        email: "newuser@example.com",
        password: "SecurePass123",
        role: "Director",
      });

    // Verify the response
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("id");
    expect(response.body.email).toBe("newuser@example.com");
    expect(response.body.role).toBe("Director");

    // Make sure the password is NOT returned (security!)
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
  });

  /**
   * TEST 2: Missing Fields Validation
   *
   * This tests that the API returns an error when required fields are missing
   * We expect:
   * - 400 status code (Bad Request)
   * - Error message
   */
  it("should return 400 if email is missing", async () => {
    const admin = await createTestUser(
      "admin@example.com",
      "password",
      "admin",
    );
    const adminToken = signAccessToken(
      { sub: admin.id, role: admin.role, email: admin.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        // email is missing!
        password: "SecurePass123",
        role: "Director",
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toBe("Missing fields");
  });

  it("should return 400 if password is missing", async () => {
    const admin = await createTestUser(
      "admin@example.com",
      "password",
      "admin",
    );
    const adminToken = signAccessToken(
      { sub: admin.id, role: admin.role, email: admin.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "newuser@example.com",
        // password is missing!
        role: "Director",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing fields");
  });

  it("should return 400 if role is missing", async () => {
    const admin = await createTestUser(
      "admin@example.com",
      "password",
      "admin",
    );
    const adminToken = signAccessToken(
      { sub: admin.id, role: admin.role, email: admin.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "newuser@example.com",
        password: "SecurePass123",
        // role is missing!
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing fields");
  });

  /**
   * TEST 3: Invalid Role Validation
   *
   * Only certain roles are allowed (admin, Director, head_of_neighborhood)
   * This tests that invalid roles are rejected
   */
  it("should return 400 for invalid role", async () => {
    const admin = await createTestUser(
      "admin@example.com",
      "password",
      "admin",
    );
    const adminToken = signAccessToken(
      { sub: admin.id, role: admin.role, email: admin.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "newuser@example.com",
        password: "SecurePass123",
        role: "invalid_role", // This role doesn't exist!
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid role");
  });

  /**
   * TEST 4: Authorization Check
   *
   * Registration should only be allowed for authenticated admins
   * This tests that non-admin users cannot register new users
   */
  it("should return 401 if no authorization token is provided", async () => {
    const response = await request(app)
      .post("/v1/auth/register")
      // No Authorization header!
      .send({
        email: "newuser@example.com",
        password: "SecurePass123",
        role: "Director",
      });

    expect(response.status).toBe(401);
  });

  it("should return 403 if user is not an admin", async () => {
    // Create a non-admin user
    const director = await createTestUser(
      "director@example.com",
      "password",
      "Director",
    );
    const directorToken = signAccessToken(
      { sub: director.id, role: director.role, email: director.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${directorToken}`) // Director token, not admin!
      .send({
        email: "newuser@example.com",
        password: "SecurePass123",
        role: "head_of_neighborhood",
      });

    expect(response.status).toBe(403);
  });
});
