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
const prisma_1 = __importDefault(require("../../prisma")); // Import Prisma for direct DB manipulation in a test
const app = (0, server_1.createServer)();
describe("GET /v1/auth/current", () => {
  // Happy Path Tests
  describe("when a valid token is provided", () => {
    it("should return the current manager's info with a null neighborhood", async () => {
      const manager = await (0, helpers_1.createTestUser)(
        "manager.current@example.com",
        "password",
        "manager",
        true,
        "Manager Current",
      );
      const managerToken = (0, jwt_1.signAccessToken)(
        { sub: manager.id, role: manager.role, email: manager.email },
        config_1.default.ACCESS_SECRET,
        config_1.default.ACCESS_EXPIRES,
      );
      const response = await (0, supertest_1.default)(app)
        .get("/v1/auth/current")
        .set("Authorization", `Bearer ${managerToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: manager.id,
        name: "Manager Current",
        email: "manager.current@example.com",
        role: "manager",
        neighborhood: null, // Manager should not have a neighborhood
        is_active: true,
      });
      // Ensure sensitive data is not leaked
      expect(response.body).not.toHaveProperty("passwordHash");
    });
    it("should return the current admin's info with a null neighborhood", async () => {
      const admin = await (0, helpers_1.createTestUser)(
        "admin.current@example.com",
        "password",
        "admin",
        true,
        "Admin Current",
      );
      const adminToken = (0, jwt_1.signAccessToken)(
        { sub: admin.id, role: admin.role, email: admin.email },
        config_1.default.ACCESS_SECRET,
        config_1.default.ACCESS_EXPIRES,
      );
      const response = await (0, supertest_1.default)(app)
        .get("/v1/auth/current")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: admin.id,
        name: "Admin Current",
        email: "admin.current@example.com",
        role: "admin",
        neighborhood: null, // Admin should not have a neighborhood
        is_active: true,
      });
      expect(response.body).not.toHaveProperty("passwordHash");
    });
    it("should return the current mukhtar's info with their neighborhood", async () => {
      // Since createTestUser might not support neighborhood, we create it directly with Prisma
      const mukhtar = await prisma_1.default.user.create({
        data: {
          name: "Mukhtar Current",
          email: "mukhtar.current@example.com",
          passwordHash: "dummy-hash", // Not used in this test
          role: "mukhtar",
          is_active: true,
          neighborhood: "Testville",
        },
      });
      const mukhtarToken = (0, jwt_1.signAccessToken)(
        { sub: mukhtar.id, role: mukhtar.role, email: mukhtar.email },
        config_1.default.ACCESS_SECRET,
        config_1.default.ACCESS_EXPIRES,
      );
      const response = await (0, supertest_1.default)(app)
        .get("/v1/auth/current")
        .set("Authorization", `Bearer ${mukhtarToken}`);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: mukhtar.id,
        name: "Mukhtar Current",
        email: "mukhtar.current@example.com",
        role: "mukhtar",
        neighborhood: "Testville", // Mukhtar should have their neighborhood
        is_active: true,
      });
      expect(response.body).not.toHaveProperty("passwordHash");
      // Clean up the manually created user
      await prisma_1.default.user.delete({ where: { id: mukhtar.id } });
    });
  });
  // Error Case Tests
  describe("when authentication fails", () => {
    it("should return 401 if no authorization token is provided", async () => {
      const response = await (0, supertest_1.default)(app).get(
        "/v1/auth/current",
      );
      expect(response.status).toBe(401);
    });
    it("should return 401 if an invalid token is provided", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/auth/current")
        .set("Authorization", "Bearer invalid-token-string");
      expect(response.status).toBe(401);
    });
    it("should return 404 if the token is valid but the user does not exist", async () => {
      const user = await (0, helpers_1.createTestUser)(
        "ghost@example.com",
        "password",
        "admin",
        true,
        "Ghost User",
      );
      const token = (0, jwt_1.signAccessToken)(
        { sub: user.id, role: user.role, email: user.email },
        config_1.default.ACCESS_SECRET,
        config_1.default.ACCESS_EXPIRES,
      );
      // Delete the user from the DB after the token has been created
      await prisma_1.default.user.delete({ where: { id: user.id } });
      const response = await (0, supertest_1.default)(app)
        .get("/v1/auth/current")
        .set("Authorization", `Bearer ${token}`);
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });
  });
});
