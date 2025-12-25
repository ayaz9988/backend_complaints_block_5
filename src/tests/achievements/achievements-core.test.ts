// src/tests/achievements/achievements.test.ts
import request from "supertest";
import { Express } from "express";
import { createTestUser, loginUser } from "../helpers";
import { createServer } from "../../server";
import prisma from "../../prisma";

const app = createServer();

describe("Achievements API", () => {
  let adminToken: string;
  let managerToken: string;
  let mukhtarToken: string;
  let testAchievementId: string;

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

    // 3. Create a test achievement for use in tests, linked to the admin user.
    const testAchievement = await prisma.achievement.create({
      data: {
        title: "Test Achievement",
        description: "This is a test achievement.",
        iconUrl: "http://example.com/icon.png",
        status: "active",
        createdBy: adminUser.id, // Use the ID of the freshly created admin user
      },
    });

    testAchievementId = testAchievement.id;
  });

  describe("POST /achievements", () => {
    it("should create a new achievement with admin token", async () => {
      const achievementData = {
        title: "New Admin Achievement",
        description: "This is a new achievement created by an admin.",
        iconUrl: "http://example.com/new-icon.png",
      };

      const response = await request(app)
        .post("/v1/achievements")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(achievementData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe(achievementData.title);
      expect(response.body.description).toBe(achievementData.description);
      expect(response.body.iconUrl).toBe(achievementData.iconUrl);
      expect(response.body.status).toBe("active");
    });

    it("should create a new achievement with manager token", async () => {
      const achievementData = {
        title: "New Manager Achievement",
        description: "This is a new achievement created by a manager.",
      };

      const response = await request(app)
        .post("/v1/achievements")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(achievementData)
        .expect(201);

      expect(response.body.title).toBe(achievementData.title);
    });

    it("should return 401 when creating without a token", async () => {
      const achievementData = {
        title: "No Token",
        description: "This should fail.",
      };

      await request(app)
        .post("/v1/achievements")
        .send(achievementData)
        .expect(401);
    });

    it("should return 403 when creating with mukhtar token", async () => {
      const achievementData = {
        title: "Mukhtar Fails",
        description: "This should fail due to permissions.",
      };

      await request(app)
        .post("/v1/achievements")
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .send(achievementData)
        .expect(403);
    });
  });

  describe("GET /achievements", () => {
    it("should return a list of active achievements for public", async () => {
      // Create an inactive achievement that should not be returned
      const creatorUser = await prisma.user.findUnique({
        where: { email: "admin@test.com" },
      });
      await prisma.achievement.create({
        data: {
          title: "Inactive Achievement",
          description: "This should not be visible.",
          status: "inactive",
          createdBy: creatorUser!.id,
        },
      });

      const response = await request(app).get("/v1/achievements").expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      // All returned achievements should be active
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(response.body.every((a: any) => a.status === "active")).toBe(true);
      // The inactive one should not be in the list
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.body.some((a: any) => a.title === "Inactive Achievement"),
      ).toBe(false);
    });
  });

  describe("GET /achievements/:id", () => {
    it("should return a specific active achievement", async () => {
      const response = await request(app)
        .get(`/v1/achievements/${testAchievementId}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testAchievementId);
      expect(response.body.title).toBe("Test Achievement");
    });

    it("should return 404 for non-existent achievement", async () => {
      await request(app)
        .get("/v1/achievements/00000000-0000-0000-0000-000000000000")
        .expect(404);
    });

    it("should return 404 for an inactive achievement", async () => {
      const creatorUser = await prisma.user.findUnique({
        where: { email: "admin@test.com" },
      });
      const inactiveAchievement = await prisma.achievement.create({
        data: {
          title: "Inactive Single",
          description: "This should not be visible.",
          status: "inactive",
          createdBy: creatorUser!.id,
        },
      });

      await request(app)
        .get(`/v1/achievements/${inactiveAchievement.id}`)
        .expect(404);
    });
  });

  describe("PATCH /achievements/:id", () => {
    it("should update an achievement with admin token", async () => {
      const updateData = {
        title: "Updated Admin Achievement",
        description: "This description has been updated.",
      };

      const response = await request(app)
        .patch(`/v1/achievements/${testAchievementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.description).toBe(updateData.description);
    });

    it("should update an achievement with manager token", async () => {
      const updateData = {
        status: "inactive",
      };
      await request(app)
        .patch(`/v1/achievements/${testAchievementId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send(updateData)
        .expect(200);
    });

    it("should return 401 when updating without a token", async () => {
      await request(app)
        .patch(`/v1/achievements/${testAchievementId}`)
        .send({ title: "No Token" })
        .expect(401);
    });

    it("should return 403 when updating with mukhtar token", async () => {
      await request(app)
        .patch(`/v1/achievements/${testAchievementId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .send({ title: "Mukhtar Fails" })
        .expect(403);
    });

    it("should return 404 when trying to update a non-existent achievement", async () => {
      await request(app)
        .patch("/v1/achievements/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ title: "Doesn't exist" })
        .expect(404);
    });
  });

  describe("DELETE /achievements/:id", () => {
    it("should delete an achievement with admin token", async () => {
      await request(app)
        .delete(`/v1/achievements/${testAchievementId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(204); // 204 No Content

      // Verify the achievement is actually deleted
      const deletedAchievement = await prisma.achievement.findUnique({
        where: { id: testAchievementId },
      });

      expect(deletedAchievement).toBeNull();
    });

    it("should delete an achievement with manager token", async () => {
      // Create a new one to delete with manager token
      const creatorUser = await prisma.user.findUnique({
        where: { email: "manager@test.com" },
      });
      const newAchievement = await prisma.achievement.create({
        data: {
          title: "To Delete by Manager",
          description: "...",
          status: "active",
          createdBy: creatorUser!.id,
        },
      });

      await request(app)
        .delete(`/v1/achievements/${newAchievement.id}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(204); // 204 No Content
    });

    it("should return 401 when deleting without a token", async () => {
      await request(app)
        .delete(`/v1/achievements/${testAchievementId}`)
        .expect(401);
    });

    it("should return 403 when deleting with mukhtar token", async () => {
      await request(app)
        .delete(`/v1/achievements/${testAchievementId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(403);
    });

    it("should return 404 when trying to delete a non-existent achievement", async () => {
      await request(app)
        .delete("/v1/achievements/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
