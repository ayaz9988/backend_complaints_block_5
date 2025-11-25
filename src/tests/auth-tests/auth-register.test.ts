import request from "supertest";
import { createServer } from "../../server";
import { createTestUser } from "./../helpers";
import { signAccessToken } from "../../lib/jwt";
import config from "../../config";

const app = createServer();

describe("POST /v1/auth/register", () => {
  it("should register a new user successfully with manager token", async () => {
    const manager = await createTestUser(
      "manager@example.com",
      "password",
      "manager",
      true,
      "Manager User",
    );

    const managerToken = signAccessToken(
      { sub: manager.id, role: manager.role, email: manager.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "New User",
        email: "newuser@example.com",
        password: "SecurePass123",
        role: "admin",
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", "New User");
    expect(response.body.email).toBe("newuser@example.com");
    expect(response.body.role).toBe("admin");
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
  });

  it("should return 400 if email is missing", async () => {
    const manager = await createTestUser(
      "manager@example.com",
      "password",
      "manager",
      true,
      "Manager User",
    );
    const managerToken = signAccessToken(
      { sub: manager.id, role: manager.role, email: manager.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "New User",
        password: "SecurePass123",
        role: "admin",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing fields");
  });

  it("should return 400 if password is missing", async () => {
    const manager = await createTestUser(
      "manager@example.com",
      "password",
      "manager",
      true,
      "Manager User",
    );
    const managerToken = signAccessToken(
      { sub: manager.id, role: manager.role, email: manager.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "New User",
        email: "newuser@example.com",
        role: "admin",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing fields");
  });

  it("should return 400 if role is missing", async () => {
    const manager = await createTestUser(
      "manager@example.com",
      "password",
      "manager",
      true,
      "Manager User",
    );
    const managerToken = signAccessToken(
      { sub: manager.id, role: manager.role, email: manager.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "New User",
        email: "newuser@example.com",
        password: "SecurePass123",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Missing fields");
  });

  it("should return 400 for invalid role", async () => {
    const manager = await createTestUser(
      "manager@example.com",
      "password",
      "manager",
      true,
      "Manager User",
    );
    const managerToken = signAccessToken(
      { sub: manager.id, role: manager.role, email: manager.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "New User",
        email: "newuser@example.com",
        password: "SecurePass123",
        role: "invalid_role",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Invalid role");
  });

  it("should return 401 if no authorization token is provided", async () => {
    const response = await request(app).post("/v1/auth/register").send({
      name: "New User",
      email: "newuser@example.com",
      password: "SecurePass123",
      role: "admin",
    });

    expect(response.status).toBe(401);
  });

  it("should return 403 if user is not a manager", async () => {
    const nonManager = await createTestUser(
      "user@example.com",
      "password",
      "mukhtar",
      true,
      "Non Manager User",
    );
    const token = signAccessToken(
      { sub: nonManager.id, role: nonManager.role, email: nonManager.email },
      config.ACCESS_SECRET,
      config.ACCESS_EXPIRES,
    );

    const response = await request(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "New User",
        email: "newuser@example.com",
        password: "SecurePass123",
        role: "admin",
      });

    expect(response.status).toBe(403);
  });
});
