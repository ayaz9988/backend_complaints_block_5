"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const helpers_1 = require("../helpers");
const server_1 = require("../../server");
const prisma_1 = __importDefault(require("../../prisma"));
const app = (0, server_1.createServer)();
describe("Users API", () => {
  let adminToken;
  let managerToken;
  let mukhtarToken;
  let testAdminId;
  let testMukhtarId;
  // This hook runs before each test, ensuring a clean slate and fresh data.
  beforeEach(async () => {
    // 1. Create the three required users for the test suite.
    const adminUser = await (0, helpers_1.createTestUser)(
      "admin@test.com",
      "password123",
      "admin",
    );
    const managerUser = await (0, helpers_1.createTestUser)(
      "manager@test.com",
      "password123",
      "manager",
    );
    const mukhtarUser = await (0, helpers_1.createTestUser)(
      "mukhtar@test.com",
      "password123",
      "mukhtar",
      true,
      "Test Mukhtar",
      "Test Neighborhood",
    );
    testAdminId = adminUser.id;
    testMukhtarId = mukhtarUser.id;
    // 2. Log in as these users to get their tokens.
    const adminLogin = await (0, helpers_1.loginUser)(
      app,
      "admin@test.com",
      "password123",
    );
    const managerLogin = await (0, helpers_1.loginUser)(
      app,
      "manager@test.com",
      "password123",
    );
    const mukhtarLogin = await (0, helpers_1.loginUser)(
      app,
      "mukhtar@test.com",
      "password123",
    );
    adminToken = adminLogin.body.accessToken;
    managerToken = managerLogin.body.accessToken;
    mukhtarToken = mukhtarLogin.body.accessToken;
    // 3. Create some test complaints for the mukhtar
    await prisma_1.default.complaints.createMany({
      data: [
        {
          submitterName: "Test User 1",
          contactNumber: "1234567890",
          description: "Test complaint 1",
          location: "Test Location 1",
          neighborhood: "Test Neighborhood",
          complaint_type: "noise",
          priority: "low",
          trackingTag: "test-tracking-tag-1",
          estimatedReviewTime: "1 week",
          mukhtarInitialId: mukhtarUser.id,
        },
        {
          submitterName: "Test User 2",
          contactNumber: "0987654321",
          description: "Test complaint 2",
          location: "Test Location 2",
          neighborhood: "Test Neighborhood",
          complaint_type: "infrastructure",
          priority: "low",
          trackingTag: "test-tracking-tag-2",
          estimatedReviewTime: "1 week",
          mukhtarInitialId: mukhtarUser.id,
        },
      ],
    });
  });
  describe("GET /users", () => {
    it("should return all admin and mukhtar users when requested by manager without role parameter", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/users/")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      expect(response.body).toHaveLength(2); // admin and mukhtar
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(response.body.some((user) => user.role === "admin")).toBe(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(response.body.some((user) => user.role === "mukhtar")).toBe(true);
    });
    it("should return only admin users when requested by manager with role=admin", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/users/?role=admin")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].role).toBe("admin");
    });
    it("should return only mukhtar users when requested by manager with role=mukhtar", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/users/?role=mukhtar")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].role).toBe("mukhtar");
    });
    it("should return only mukhtar users when requested by admin", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/users/")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].role).toBe("mukhtar");
    });
    it("should return only mukhtar users when requested by admin with role=admin", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/users/?role=admin")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].role).toBe("mukhtar");
    });
    it("should return only mukhtar users when requested by admin with role=mukhtar", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/users/?role=mukhtar")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].role).toBe("mukhtar");
    });
    it("should return 401 when requested without a token", async () => {
      await (0, supertest_1.default)(app).get("/v1/users/").expect(401);
    });
    it("should return 403 when requested by mukhtar", async () => {
      await (0, supertest_1.default)(app)
        .get("/v1/users/")
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(403);
    });
  });
  describe("GET /users/:id", () => {
    it("should return user details when requested by manager", async () => {
      const response = await (0, supertest_1.default)(app)
        .get(`/v1/users/${testAdminId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      expect(response.body).toHaveProperty("id", testAdminId);
      expect(response.body).toHaveProperty("email", "admin@test.com");
      expect(response.body).toHaveProperty("role", "admin");
    });
    it("should return mukhtar details when requested by admin", async () => {
      const response = await (0, supertest_1.default)(app)
        .get(`/v1/users/${testMukhtarId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toHaveProperty("id", testMukhtarId);
      expect(response.body).toHaveProperty("email", "mukhtar@test.com");
      expect(response.body).toHaveProperty("role", "mukhtar");
    });
    // NEW: Test case specifically requested
    it("should return mukhtar details when requested by manager", async () => {
      const response = await (0, supertest_1.default)(app)
        .get(`/v1/users/${testMukhtarId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      expect(response.body).toHaveProperty("id", testMukhtarId);
      expect(response.body).toHaveProperty("email", "mukhtar@test.com");
      expect(response.body).toHaveProperty("role", "mukhtar");
    });
    it("should return 403 when admin tries to view another admin", async () => {
      await (0, supertest_1.default)(app)
        .get(`/v1/users/${testAdminId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });
    it("should return 401 when requested without a token", async () => {
      await (0, supertest_1.default)(app)
        .get(`/v1/users/${testMukhtarId}`)
        .expect(401);
    });
    it("should return 403 when requested by mukhtar", async () => {
      await (0, supertest_1.default)(app)
        .get(`/v1/users/${testAdminId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(403);
    });
    it("should return 404 for non-existent user", async () => {
      await (0, supertest_1.default)(app)
        .get("/v1/users/non-existent-id")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(404);
    });
  });
  describe("GET /users/:id/complaints", () => {
    it("should return user complaints when requested by manager", async () => {
      const response = await (0, supertest_1.default)(app)
        .get(`/v1/users/${testMukhtarId}/complaints`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty("submitterName", "Test User 1");
      expect(response.body[1]).toHaveProperty("submitterName", "Test User 2");
    });
    it("should return mukhtar complaints when requested by admin", async () => {
      const response = await (0, supertest_1.default)(app)
        .get(`/v1/users/${testMukhtarId}/complaints`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toHaveLength(2);
    });
    it("should return 403 when admin tries to view another admin's complaints", async () => {
      await (0, supertest_1.default)(app)
        .get(`/v1/users/${testAdminId}/complaints`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });
    it("should return 401 when requested without a token", async () => {
      await (0, supertest_1.default)(app)
        .get(`/v1/users/${testMukhtarId}/complaints`)
        .expect(401);
    });
    it("should return 403 when requested by mukhtar", async () => {
      await (0, supertest_1.default)(app)
        .get(`/v1/users/${testMukhtarId}/complaints`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(403);
    });
  });
  describe("PATCH /users/:id", () => {
    it("should update user info when requested by manager", async () => {
      const updateData = {
        name: "Updated Admin Name",
        email: "updated-admin@test.com",
        password: "newpassword123",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testAdminId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.email).toBe(updateData.email);
    });
    it("should update mukhtar info when requested by admin", async () => {
      const updateData = {
        name: "Updated Mukhtar Name",
        email: "updated-mukhtar@test.com",
        neighborhood: "Updated Neighborhood",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testMukhtarId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.email).toBe(updateData.email);
      expect(response.body.neighborhood).toBe(updateData.neighborhood);
    });
    it("should not update password when requested by admin", async () => {
      const updateData = {
        name: "Updated Mukhtar Name",
        password: "newpassword123",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testMukhtarId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      expect(response.body.name).toBe(updateData.name);
      // Password should not be in the response
      expect(response.body).not.toHaveProperty("password");
    });
    it("should return 403 when admin tries to update another admin", async () => {
      await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testAdminId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Updated Name" })
        .expect(403);
    });
    it("should return 401 when updating without a token", async () => {
      await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testMukhtarId}`)
        .send({ name: "Updated Name" })
        .expect(401);
    });
    it("should return 403 when updating by mukhtar", async () => {
      await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testMukhtarId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .send({ name: "Updated Name" })
        .expect(403);
    });
    it("should return 404 when trying to update a non-existent user", async () => {
      await (0, supertest_1.default)(app)
        .patch("/v1/users/non-existent-id")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({ name: "Updated Name" })
        .expect(404);
    });
  });
  describe("PATCH /users/:id/deactivate", () => {
    it("should deactivate user when requested by manager", async () => {
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testAdminId}/deactivate`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      expect(response.body.is_active).toBe(false);
    });
    it("should deactivate mukhtar when requested by admin", async () => {
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testMukhtarId}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.is_active).toBe(false);
    });
    // NEW: Test case for manager deactivating a mukhtar
    it("should deactivate mukhtar when requested by manager", async () => {
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testMukhtarId}/deactivate`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      expect(response.body.is_active).toBe(false);
    });
    it("should return 403 when admin tries to deactivate another admin", async () => {
      await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testAdminId}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });
    it("should return 401 when deactivating without a token", async () => {
      await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testMukhtarId}/deactivate`)
        .expect(401);
    });
    it("should return 403 when deactivating by mukhtar", async () => {
      await (0, supertest_1.default)(app)
        .patch(`/v1/users/${testMukhtarId}/deactivate`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(403);
    });
    it("should return 404 when trying to deactivate a non-existent user", async () => {
      await (0, supertest_1.default)(app)
        .patch("/v1/users/non-existent-id/deactivate")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(404);
    });
  });
  describe("DELETE /users/:id", () => {
    it("should delete user when requested by manager", async () => {
      await (0, supertest_1.default)(app)
        .delete(`/v1/users/${testAdminId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      // Verify the user is actually deleted
      const deletedUser = await prisma_1.default.user.findUnique({
        where: { id: testAdminId },
      });
      expect(deletedUser).toBeNull();
    });
    it("should delete mukhtar when requested by manager", async () => {
      await (0, supertest_1.default)(app)
        .delete(`/v1/users/${testMukhtarId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      // Verify the user is actually deleted
      const deletedUser = await prisma_1.default.user.findUnique({
        where: { id: testMukhtarId },
      });
      expect(deletedUser).toBeNull();
    });
    it("should return 403 when admin tries to delete a user", async () => {
      await (0, supertest_1.default)(app)
        .delete(`/v1/users/${testMukhtarId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });
    it("should return 401 when deleting without a token", async () => {
      await (0, supertest_1.default)(app)
        .delete(`/v1/users/${testMukhtarId}`)
        .expect(401);
    });
    it("should return 403 when deleting by mukhtar", async () => {
      await (0, supertest_1.default)(app)
        .delete(`/v1/users/${testMukhtarId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(403);
    });
    it("should return 404 when trying to delete a non-existent user", async () => {
      await (0, supertest_1.default)(app)
        .delete("/v1/users/non-existent-id")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(404);
    });
  });
});
