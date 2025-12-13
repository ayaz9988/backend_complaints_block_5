"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/initiatives/initiatives-core.test.ts
const supertest_1 = __importDefault(require("supertest"));
const helpers_1 = require("../helpers");
const server_1 = require("../../server");
const prisma_1 = __importDefault(require("../../prisma"));
const app = (0, server_1.createServer)();
describe("Initiatives API", () => {
  let adminToken;
  let managerToken;
  let testInitiativeId;
  beforeAll(async () => {
    // First, delete any refresh tokens associated with our test users
    await prisma_1.default.refreshToken.deleteMany({
      where: {
        user: {
          email: {
            in: ["admin@test.com", "manager@test.com"],
          },
        },
      },
    });
    // Clean up any existing test users before creating new ones
    await prisma_1.default.user.deleteMany({
      where: {
        email: {
          in: ["admin@test.com", "manager@test.com"],
        },
      },
    });
    // Create test users for each role
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
    // Login to get tokens
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
    adminToken = adminLogin.body.accessToken;
    managerToken = managerLogin.body.accessToken;
  });
  beforeEach(async () => {
    // Clean up any existing test initiatives before creating a new one
    await prisma_1.default.initiative.deleteMany({
      where: {
        title: {
          in: ["Test Initiative", "Updated Initiative", "Initiative to Delete"],
        },
      },
    });
    // Create a test initiative for use in tests
    const testInitiative = await prisma_1.default.initiative.create({
      data: {
        title: "Test Initiative",
        description: "A test initiative description",
        submitterName: "Test Submitter",
        contactNumber: "1234567890",
        location: "Test Location",
        neighborhood: "Test Neighborhood",
        status: "pending",
      },
    });
    testInitiativeId = testInitiative.id.toString();
  });
  describe("POST /initiatives", () => {
    it("should create a new initiative", async () => {
      const initiativeData = {
        title: "Community Garden Initiative",
        description: "Create a community garden in the neighborhood",
        submitterName: "John Doe",
        contactNumber: "9876543210",
        location: "Central Park",
        neighborhood: "Downtown",
      };
      const response = await (0, supertest_1.default)(app)
        .post("/v1/initiatives")
        .send(initiativeData)
        .expect(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe(initiativeData.title);
      expect(response.body.description).toBe(initiativeData.description);
      expect(response.body.status).toBe("pending");
      expect(response.body.submitterName).toBe(initiativeData.submitterName);
    });
    it("should create an initiative with minimal data", async () => {
      const initiativeData = {
        title: "Minimal Initiative",
        description: "Just the basics",
      };
      const response = await (0, supertest_1.default)(app)
        .post("/v1/initiatives")
        .send(initiativeData)
        .expect(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe(initiativeData.title);
      expect(response.body.description).toBe(initiativeData.description);
      expect(response.body.status).toBe("pending");
      expect(response.body.submitterName).toBeNull();
    });
    it("should reject creation without title", async () => {
      const initiativeData = {
        description: "No title provided",
      };
      await (0, supertest_1.default)(app)
        .post("/v1/initiatives")
        .send(initiativeData)
        .expect(400);
    });
    it("should reject creation without description", async () => {
      const initiativeData = {
        title: "No description",
      };
      await (0, supertest_1.default)(app)
        .post("/v1/initiatives")
        .send(initiativeData)
        .expect(400);
    });
  });
  describe("GET /initiatives", () => {
    it("should return all initiatives for admin", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/initiatives")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("title");
    });
    it("should return all initiatives for manager", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/initiatives")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    it("should reject access without authentication", async () => {
      await (0, supertest_1.default)(app).get("/v1/initiatives").expect(401);
    });
  });
  describe("GET /initiatives/:id", () => {
    it("should return a specific initiative", async () => {
      const response = await (0, supertest_1.default)(app)
        .get(`/v1/initiatives/${testInitiativeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toHaveProperty("id", testInitiativeId);
      expect(response.body).toHaveProperty("title", "Test Initiative");
    });
    it("should return 404 for non-existent initiative", async () => {
      await (0, supertest_1.default)(app)
        .get("/v1/initiatives/999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
    it("should reject access without authentication", async () => {
      await (0, supertest_1.default)(app)
        .get(`/v1/initiatives/${testInitiativeId}`)
        .expect(401);
    });
  });
  describe("PATCH /initiatives/:id", () => {
    it("should update initiative title and description", async () => {
      const updateData = {
        title: "Updated Initiative",
        description: "Updated description",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/initiatives/${testInitiativeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
    });
    it("should update initiative status", async () => {
      const updateData = {
        status: "approved",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/initiatives/${testInitiativeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      expect(response.body.status).toBe("approved");
    });
    it("should reject invalid status", async () => {
      const updateData = {
        status: "invalid",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/initiatives/${testInitiativeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      // Status should not change
      expect(response.body.status).toBe("pending");
    });
    it("should return 404 for non-existent initiative", async () => {
      const updateData = {
        title: "Non-existent",
      };
      await (0, supertest_1.default)(app)
        .patch("/v1/initiatives/999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });
    it("should reject access without authentication", async () => {
      const updateData = {
        title: "Unauthorized Update",
      };
      await (0, supertest_1.default)(app)
        .patch(`/v1/initiatives/${testInitiativeId}`)
        .send(updateData)
        .expect(401);
    });
  });
  describe("DELETE /initiatives/:id", () => {
    it("should delete an initiative for admin", async () => {
      // Create a test initiative to delete
      const testInitiative = await prisma_1.default.initiative.create({
        data: {
          title: "Initiative to Delete",
          description: "This will be deleted",
        },
      });
      const initiativeId = testInitiative.id.toString();
      await (0, supertest_1.default)(app)
        .delete(`/v1/initiatives/${initiativeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      // Verify the initiative is actually deleted
      const deletedInitiative = await prisma_1.default.initiative.findUnique({
        where: { id: BigInt(initiativeId) },
      });
      expect(deletedInitiative).toBeNull();
    });
    it("should delete an initiative for manager", async () => {
      // Create a test initiative to delete
      const testInitiative = await prisma_1.default.initiative.create({
        data: {
          title: "Initiative to Delete by Manager",
          description: "This will be deleted by manager",
        },
      });
      const initiativeId = testInitiative.id.toString();
      await (0, supertest_1.default)(app)
        .delete(`/v1/initiatives/${initiativeId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      // Verify the initiative is actually deleted
      const deletedInitiative = await prisma_1.default.initiative.findUnique({
        where: { id: BigInt(initiativeId) },
      });
      expect(deletedInitiative).toBeNull();
    });
    it("should return 404 for non-existent initiative", async () => {
      await (0, supertest_1.default)(app)
        .delete("/v1/initiatives/999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
    it("should reject access without authentication", async () => {
      await (0, supertest_1.default)(app)
        .delete(`/v1/initiatives/${testInitiativeId}`)
        .expect(401);
    });
  });
});
