"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/announcements/announcements.test.ts
const supertest_1 = __importDefault(require("supertest"));
const helpers_1 = require("../helpers");
const server_1 = require("../../server");
const prisma_1 = __importDefault(require("../../prisma"));
const app = (0, server_1.createServer)();
describe("Announcements API", () => {
  let adminToken;
  let managerToken;
  let mukhtarToken;
  let testAnnouncementId;
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
    await (0, helpers_1.createTestUser)(
      "mukhtar@test.com",
      "password123",
      "mukhtar",
      true,
      "Test Mukhtar",
      "Test Neighborhood",
    );
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
    // 3. Create a test announcement for use in tests, linked to the admin user.
    const testAnnouncement = await prisma_1.default.announcement.create({
      data: {
        title: "Test Announcement",
        content: "This is a test announcement.",
        status: "active",
        createdBy: adminUser.id, // Use the ID of the freshly created admin user
      },
    });
    testAnnouncementId = testAnnouncement.id;
  });
  describe("POST /announcements", () => {
    it("should create a new announcement with admin token", async () => {
      const announcementData = {
        title: "New Admin Announcement",
        content: "This is a new announcement created by an admin.",
      };
      const response = await (0, supertest_1.default)(app)
        .post("/v1/announcements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(announcementData)
        .expect(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe(announcementData.title);
      expect(response.body.content).toBe(announcementData.content);
      expect(response.body.status).toBe("active");
    });
    it("should create a new announcement with manager token", async () => {
      const announcementData = {
        title: "New Manager Announcement",
        content: "This is a new announcement created by a manager.",
      };
      const response = await (0, supertest_1.default)(app)
        .post("/v1/announcements")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(announcementData)
        .expect(201);
      expect(response.body.title).toBe(announcementData.title);
    });
    it("should return 401 when creating without a token", async () => {
      const announcementData = {
        title: "No Token",
        content: "This should fail.",
      };
      await (0, supertest_1.default)(app)
        .post("/v1/announcements")
        .send(announcementData)
        .expect(401);
    });
    it("should return 403 when creating with mukhtar token", async () => {
      const announcementData = {
        title: "Mukhtar Fails",
        content: "This should fail due to permissions.",
      };
      await (0, supertest_1.default)(app)
        .post("/v1/announcements")
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .send(announcementData)
        .expect(403);
    });
  });
  describe("GET /announcements", () => {
    it("should return a list of active announcements for public", async () => {
      // Create an inactive announcement that should not be returned
      const creatorUser = await prisma_1.default.user.findUnique({
        where: { email: "admin@test.com" },
      });
      await prisma_1.default.announcement.create({
        data: {
          title: "Inactive Announcement",
          content: "This should not be visible.",
          status: "inactive",
          createdBy: creatorUser.id,
        },
      });
      const response = await (0, supertest_1.default)(app)
        .get("/v1/announcements")
        .expect(200);
      expect(response.body.length).toBeGreaterThan(0);
      // All returned announcements should be active
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(response.body.every((a) => a.status === "active")).toBe(true);
      // The inactive one should not be in the list
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.body.some((a) => a.title === "Inactive Announcement"),
      ).toBe(false);
    });
  });
  describe("GET /announcements/:id", () => {
    it("should return a specific active announcement", async () => {
      const response = await (0, supertest_1.default)(app)
        .get(`/v1/announcements/${testAnnouncementId}`)
        .expect(200);
      expect(response.body).toHaveProperty("id", testAnnouncementId);
      expect(response.body.title).toBe("Test Announcement");
    });
    it("should return 404 for non-existent announcement", async () => {
      await (0, supertest_1.default)(app)
        .get("/v1/announcements/non-existent-id")
        .expect(404);
    });
    it("should return 404 for an inactive announcement", async () => {
      const creatorUser = await prisma_1.default.user.findUnique({
        where: { email: "admin@test.com" },
      });
      const inactiveAnnouncement = await prisma_1.default.announcement.create({
        data: {
          title: "Inactive Single",
          content: "This should not be visible.",
          status: "inactive",
          createdBy: creatorUser.id,
        },
      });
      await (0, supertest_1.default)(app)
        .get(`/v1/announcements/${inactiveAnnouncement.id}`)
        .expect(404);
    });
  });
  describe("PATCH /announcements/:id", () => {
    it("should update an announcement with admin token", async () => {
      const updateData = {
        title: "Updated Admin Announcement",
        content: "This content has been updated.",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/announcements/${testAnnouncementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.content).toBe(updateData.content);
    });
    it("should update an announcement with manager token", async () => {
      const updateData = {
        status: "inactive",
      };
      await (0, supertest_1.default)(app)
        .patch(`/v1/announcements/${testAnnouncementId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);
    });
    it("should return 401 when updating without a token", async () => {
      await (0, supertest_1.default)(app)
        .patch(`/v1/announcements/${testAnnouncementId}`)
        .send({ title: "No Token" })
        .expect(401);
    });
    it("should return 403 when updating with mukhtar token", async () => {
      await (0, supertest_1.default)(app)
        .patch(`/v1/announcements/${testAnnouncementId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .send({ title: "Mukhtar Fails" })
        .expect(403);
    });
    it("should return 404 when trying to update a non-existent announcement", async () => {
      await (0, supertest_1.default)(app)
        .patch("/v1/announcements/non-existent-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Doesn't exist" })
        .expect(404);
    });
  });
  describe("DELETE /announcements/:id", () => {
    it("should delete an announcement with admin token", async () => {
      await (0, supertest_1.default)(app)
        .delete(`/v1/announcements/${testAnnouncementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(204); // 204 No Content
      // Verify the announcement is actually deleted
      const deletedAnnouncement =
        await prisma_1.default.announcement.findUnique({
          where: { id: testAnnouncementId },
        });
      expect(deletedAnnouncement).toBeNull();
    });
    it("should delete an announcement with manager token", async () => {
      // Create a new one to delete with manager token
      const creatorUser = await prisma_1.default.user.findUnique({
        where: { email: "manager@test.com" },
      });
      const newAnnouncement = await prisma_1.default.announcement.create({
        data: {
          title: "To Delete by Manager",
          content: "...",
          status: "active",
          createdBy: creatorUser.id,
        },
      });
      await (0, supertest_1.default)(app)
        .delete(`/v1/announcements/${newAnnouncement.id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(204); // 204 No Content
    });
    it("should return 401 when deleting without a token", async () => {
      await (0, supertest_1.default)(app)
        .delete(`/v1/announcements/${testAnnouncementId}`)
        .expect(401);
    });
    it("should return 403 when deleting with mukhtar token", async () => {
      await (0, supertest_1.default)(app)
        .delete(`/v1/announcements/${testAnnouncementId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(403);
    });
    it("should return 404 when trying to delete a non-existent announcement", async () => {
      await (0, supertest_1.default)(app)
        .delete("/v1/announcements/non-existent-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
