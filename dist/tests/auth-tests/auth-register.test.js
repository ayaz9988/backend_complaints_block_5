"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = require("../../server");
const helpers_1 = require("./../helpers");
const jwt_1 = require("../../lib/jwt");
const config_1 = __importDefault(require("../../config"));
const app = (0, server_1.createServer)();
describe("POST /v1/auth/register", () => {
  // --- UPDATED TEST ---
  it("should register a new mukhtar successfully with a neighborhood", async () => {
    const manager = await (0, helpers_1.createTestUser)(
      "manager@example.com",
      "password",
      "manager",
      true,
      "Manager User",
    );
    const managerToken = (0, jwt_1.signAccessToken)(
      { sub: manager.id, role: manager.role, email: manager.email },
      config_1.default.ACCESS_SECRET,
      config_1.default.ACCESS_EXPIRES,
    );
    const response = await (0, supertest_1.default)(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "New Mukhtar",
        email: "mukhtar@example.com",
        password: "SecurePass123",
        role: "mukhtar",
        neighborhood: "Downtown District",
      });
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("name", "New Mukhtar");
    expect(response.body.email).toBe("mukhtar@example.com");
    expect(response.body.role).toBe("mukhtar");
    // NEW: Assert neighborhood is present and correct
    expect(response.body).toHaveProperty("neighborhood", "Downtown District");
    expect(response.body).not.toHaveProperty("password");
    expect(response.body).not.toHaveProperty("passwordHash");
  });
  // --- NEW TEST ---
  it("should register a new admin successfully and set neighborhood to null", async () => {
    const manager = await (0, helpers_1.createTestUser)(
      "manager2@example.com",
      "password",
      "manager",
      true,
      "Manager User 2",
    );
    const managerToken = (0, jwt_1.signAccessToken)(
      { sub: manager.id, role: manager.role, email: manager.email },
      config_1.default.ACCESS_SECRET,
      config_1.default.ACCESS_EXPIRES,
    );
    const response = await (0, supertest_1.default)(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "New Admin",
        email: "admin@example.com",
        password: "SecurePass123",
        role: "admin",
        neighborhood: "Should be ignored", // This field should be ignored for non-mukhtar roles
      });
    expect(response.status).toBe(201);
    expect(response.body.role).toBe("admin");
    // NEW: Assert neighborhood is null for non-mukhtar roles
    expect(response.body).toHaveProperty("neighborhood", null);
  });
  // --- NEW TEST ---
  it("should return 400 if registering a mukhtar without a neighborhood", async () => {
    const manager = await (0, helpers_1.createTestUser)(
      "manager3@example.com",
      "password",
      "manager",
      true,
      "Manager User 3",
    );
    const managerToken = (0, jwt_1.signAccessToken)(
      { sub: manager.id, role: manager.role, email: manager.email },
      config_1.default.ACCESS_SECRET,
      config_1.default.ACCESS_EXPIRES,
    );
    const response = await (0, supertest_1.default)(app)
      .post("/v1/auth/register")
      .set("Authorization", `Bearer ${managerToken}`)
      .send({
        name: "Incomplete Mukhtar",
        email: "incomplete@example.com",
        password: "SecurePass123",
        role: "mukhtar",
        // neighborhood is missing
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Neighborhood is required for mukhtar role",
    );
  });
  it("should return 400 if email is missing", async () => {
    const manager = await (0, helpers_1.createTestUser)(
      "manager4@example.com",
      "password",
      "manager",
      true,
      "Manager User",
    );
    const managerToken = (0, jwt_1.signAccessToken)(
      { sub: manager.id, role: manager.role, email: manager.email },
      config_1.default.ACCESS_SECRET,
      config_1.default.ACCESS_EXPIRES,
    );
    const response = await (0, supertest_1.default)(app)
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
    const manager = await (0, helpers_1.createTestUser)(
      "manager5@example.com",
      "password",
      "manager",
      true,
      "Manager User",
    );
    const managerToken = (0, jwt_1.signAccessToken)(
      { sub: manager.id, role: manager.role, email: manager.email },
      config_1.default.ACCESS_SECRET,
      config_1.default.ACCESS_EXPIRES,
    );
    const response = await (0, supertest_1.default)(app)
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
    const manager = await (0, helpers_1.createTestUser)(
      "manager6@example.com",
      "password",
      "manager",
      true,
      "Manager User",
    );
    const managerToken = (0, jwt_1.signAccessToken)(
      { sub: manager.id, role: manager.role, email: manager.email },
      config_1.default.ACCESS_SECRET,
      config_1.default.ACCESS_EXPIRES,
    );
    const response = await (0, supertest_1.default)(app)
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
    const manager = await (0, helpers_1.createTestUser)(
      "manager7@example.com",
      "password",
      "manager",
      true,
      "Manager User",
    );
    const managerToken = (0, jwt_1.signAccessToken)(
      { sub: manager.id, role: manager.role, email: manager.email },
      config_1.default.ACCESS_SECRET,
      config_1.default.ACCESS_EXPIRES,
    );
    const response = await (0, supertest_1.default)(app)
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
    const response = await (0, supertest_1.default)(app)
      .post("/v1/auth/register")
      .send({
        name: "New User",
        email: "newuser@example.com",
        password: "SecurePass123",
        role: "admin",
      });
    expect(response.status).toBe(401);
  });
  it("should return 403 if user is not a manager", async () => {
    const nonManager = await (0, helpers_1.createTestUser)(
      "user@example.com",
      "password",
      "mukhtar",
      true,
      "Non Manager User",
    );
    const token = (0, jwt_1.signAccessToken)(
      { sub: nonManager.id, role: nonManager.role, email: nonManager.email },
      config_1.default.ACCESS_SECRET,
      config_1.default.ACCESS_EXPIRES,
    );
    const response = await (0, supertest_1.default)(app)
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
