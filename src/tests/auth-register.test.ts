import request from "supertest";
import { createServer } from "../server";
import { createTestUser } from "./helpers";
import { signAccessToken } from "../lib/jwt";
import config from "../config";

const app = createServer();

describe("POST /v1/auth/register", () => {
  it("should register a new user successfully with admin token", async () => {
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
        role: "manager", // Role aligned with schema
      });

    // Should return 201 Created for new resource
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body.email).toBe("newuser@example.com");
    expect(response.body.role).toBe("manager");

    // Password or hash must not be returned
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
  });

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
        password: "SecurePass123",
        role: "manager",
      });

    expect(response.status).toBe(400);
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
        role: "manager",
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
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing fields");
  });

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
        role: "invalid_role",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid role");
  });

  it("should return 401 if no authorization token is provided", async () => {
    const response = await request(app).post("/v1/auth/register").send({
      email: "newuser@example.com",
      password: "SecurePass123",
      role: "manager",
    });

    expect(response.status).toBe(401);
  });

  it("should return 403 if user is not an admin", async () => {
    const nonAdmin = await createTestUser(
      "user@example.com",
      "password",
      "mukhtar",
    );
    const token = signAccessToken(
      { sub: nonAdmin.id, role: nonAdmin.role, email: nonAdmin.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${token}`)
      .send({
        email: "newuser@example.com",
        password: "SecurePass123",
        role: "manager",
      });

    expect(response.status).toBe(403);
  });
});
