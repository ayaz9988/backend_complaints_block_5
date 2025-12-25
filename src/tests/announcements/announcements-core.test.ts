// src/tests/announcements/announcements.test.ts
import request from "supertest";
import { Express } from "express";
import { createTestUser, loginUser } from "../helpers";
import { createServer } from "../../server";
import prisma from "../../prisma";

const app = createServer();

describe("Announcements API", () => {
  let adminToken: string;
  let managerToken: string;
  let mukhtarToken: string;
  let testAnnouncementId: string;

  // This hook runs before each test, ensuring a clean slate and fresh data.
  beforeEach(async () => {
    // 1. Create the three required users for the test suite.
    const adminUser = await createTestUser(
      "admin@test.com",
      "password123",
      "admin",
    );
    const managerUser = await createTestUser(
      "manager@test.com",
      "password123",
      "manager",
    );
    await createTestUser(
      "mukhtar@test.com",
      "password123",
      "mukhtar",
      true,
      "Test Mukhtar",
      "Test Neighborhood",
    );

    // 2. Log in as these users to get their tokens.
    const adminLogin = await loginUser(app, "admin@test.com", "password123");
    const managerLogin = await loginUser(
      app,
      "manager@test.com",
      "password123",
    );
    const mukhtarLogin = await loginUser(
      app,
      "mukhtar@test.com",
      "password123",
    );

    adminToken = adminLogin.body.accessToken;
    managerToken = managerLogin.body.accessToken;
    mukhtarToken = mukhtarLogin.body.accessToken;

    // 3. Create a test announcement for use in tests, linked to the admin user.
    const testAnnouncement = await prisma.announcement.create({
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

      const response = await request(app)
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

      const response = await request(app)
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

      await request(app)
        .post("/v1/announcements")
        .send(announcementData)
        .expect(401);
    });

    it("should return 403 when creating with mukhtar token", async () => {
      const announcementData = {
        title: "Mukhtar Fails",
        content: "This should fail due to permissions.",
      };

      await request(app)
        .post("/v1/announcements")
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .send(announcementData)
        .expect(403);
    });
  });

  describe("GET /announcements", () => {
    it("should return a list of active announcements for public", async () => {
      // Create an inactive announcement that should not be returned
      const creatorUser = await prisma.user.findUnique({
        where: { email: "admin@test.com" },
      });
      await prisma.announcement.create({
        data: {
          title: "Inactive Announcement",
          content: "This should not be visible.",
          status: "inactive",
          createdBy: creatorUser!.id,
        },
      });

      const response = await request(app).get("/v1/announcements").expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      // All returned announcements should be active
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(response.body.every((a: any) => a.status === "active")).toBe(true);
      // The inactive one should not be in the list
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.body.some((a: any) => a.title === "Inactive Announcement"),
      ).toBe(false);
    });
  });

  describe("GET /announcements/:id", () => {
    it("should return a specific active announcement", async () => {
      const response = await request(app)
        .get(`/v1/announcements/${testAnnouncementId}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testAnnouncementId);
      expect(response.body.title).toBe("Test Announcement");
    });

    it("should return 404 for non-existent announcement", async () => {
      await request(app)
        .get("/v1/announcements/00000000-0000-0000-0000-000000000000")
        .expect(404);
    });

    it("should return 404 for an inactive announcement", async () => {
      const creatorUser = await prisma.user.findUnique({
        where: { email: "admin@test.com" },
      });
      const inactiveAnnouncement = await prisma.announcement.create({
        data: {
          title: "Inactive Single",
          content: "This should not be visible.",
          status: "inactive",
          createdBy: creatorUser!.id,
        },
      });

      await request(app)
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

      const response = await request(app)
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
      await request(app)
        .patch(`/v1/announcements/${testAnnouncementId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);
    });

    it("should return 401 when updating without a token", async () => {
      await request(app)
        .patch(`/v1/announcements/${testAnnouncementId}`)
        .send({ title: "No Token" })
        .expect(401);
    });

    it("should return 403 when updating with mukhtar token", async () => {
      await request(app)
        .patch(`/v1/announcements/${testAnnouncementId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .send({ title: "Mukhtar Fails" })
        .expect(403);
    });

    it("should return 404 when trying to update a non-existent announcement", async () => {
      await request(app)
        .patch("/v1/announcements/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Doesn't exist" })
        .expect(404);
    });
  });

  describe("DELETE /announcements/:id", () => {
    it("should delete an announcement with admin token", async () => {
      await request(app)
        .delete(`/v1/announcements/${testAnnouncementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(204); // 204 No Content

      // Verify the announcement is actually deleted
      const deletedAnnouncement = await prisma.announcement.findUnique({
        where: { id: testAnnouncementId },
      });

      expect(deletedAnnouncement).toBeNull();
    });

    it("should delete an announcement with manager token", async () => {
      // Create a new one to delete with manager token
      const creatorUser = await prisma.user.findUnique({
        where: { email: "manager@test.com" },
      });
      const newAnnouncement = await prisma.announcement.create({
        data: {
          title: "To Delete by Manager",
          content: "...",
          status: "active",
          createdBy: creatorUser!.id,
        },
      });

      await request(app)
        .delete(`/v1/announcements/${newAnnouncement.id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(204); // 204 No Content
    });

    it("should return 401 when deleting without a token", async () => {
      await request(app)
        .delete(`/v1/announcements/${testAnnouncementId}`)
        .expect(401);
    });

    it("should return 403 when deleting with mukhtar token", async () => {
      await request(app)
        .delete(`/v1/announcements/${testAnnouncementId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(403);
    });

    it("should return 404 when trying to delete a non-existent announcement", async () => {
      await request(app)
        .delete("/v1/announcements/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
