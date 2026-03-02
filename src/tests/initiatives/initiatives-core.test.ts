// src/tests/initiatives/initiatives-core.test.ts
import request from "supertest";
import { Express } from "express";
import { createTestUser, loginUser, UserRole } from "../helpers";
import { createServer } from "../../server";
import prisma from "../../prisma";
import path from "path";
import fs from "fs";

const app = createServer();

describe("Initiatives API", () => {
  let adminToken: string;
  let managerToken: string;
  let testInitiativeId: string;

  beforeAll(async () => {
    // First, delete any refresh tokens associated with our test users
    await prisma.refreshToken.deleteMany({
      where: {
        user: {
          email: {
            in: ["admin@test.com", "manager@test.com"],
          },
        },
      },
    });
    // Clean up any existing test users before creating new ones
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["admin@test.com", "manager@test.com"],
        },
      },
    });

    // Create test users for each role
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

    // Login to get tokens
    const adminLogin = await loginUser(app, "admin@test.com", "password123");
    const managerLogin = await loginUser(
      app,
      "manager@test.com",
      "password123",
    );

    adminToken = adminLogin.body.accessToken;
    managerToken = managerLogin.body.accessToken;
  });

  beforeEach(async () => {
    // Clean up any existing test initiatives before creating a new one
    await prisma.initiative.deleteMany({
      where: {
        title: {
          in: ["Test Initiative", "Updated Initiative", "Initiative to Delete"],
        },
      },
    });

    // Create a test initiative for use in tests
    const testInitiative = await prisma.initiative.create({
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

    testInitiativeId = testInitiative.id;
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

      const response = await request(app)
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

      const response = await request(app)
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

      await request(app)
        .post("/v1/initiatives")
        .send(initiativeData)
        .expect(400);
    });

    it("should reject creation without description", async () => {
      const initiativeData = {
        title: "No description",
      };

      await request(app)
        .post("/v1/initiatives")
        .send(initiativeData)
        .expect(400);
    });
  });

  describe("GET /initiatives", () => {
    it("should return all initiatives for admin", async () => {
      const response = await request(app)
        .get("/v1/initiatives")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("title");
    });

    it("should return all initiatives for manager", async () => {
      const response = await request(app)
        .get("/v1/initiatives")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should reject access without authentication", async () => {
      await request(app).get("/v1/initiatives").expect(401);
    });
  });

  describe("GET /initiatives/:id", () => {
    it("should return a specific initiative", async () => {
      const response = await request(app)
        .get(`/v1/initiatives/${testInitiativeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testInitiativeId);
      expect(response.body).toHaveProperty("title", "Test Initiative");
    });

    it("should return 404 for non-existent initiative", async () => {
      await request(app)
        .get("/v1/initiatives/999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });

    it("should reject access without authentication", async () => {
      await request(app).get(`/v1/initiatives/${testInitiativeId}`).expect(401);
    });
  });

  describe("PATCH /initiatives/:id", () => {
    it("should update initiative title and description", async () => {
      const updateData = {
        title: "Updated Initiative",
        description: "Updated description",
      };

      const response = await request(app)
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

      const response = await request(app)
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

      const response = await request(app)
        .patch(`/v1/initiatives/${testInitiativeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.error).toHaveProperty(
        "message",
        "Validation failed",
      );
      expect(response.body.error).toHaveProperty("details");
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "body.status",
            message:
              "Invalid initiative status. Must be one of: pending, approved, rejected",
            code: "invalid_enum_value",
          }),
        ]),
      );
    });

    it("should return 404 for non-existent initiative", async () => {
      const updateData = {
        title: "Non-existent",
      };

      await request(app)
        .patch("/v1/initiatives/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);
    });

    it("should reject access without authentication", async () => {
      const updateData = {
        title: "Unauthorized Update",
      };

      await request(app)
        .patch(`/v1/initiatives/${testInitiativeId}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe("DELETE /initiatives/:id", () => {
    it("should delete an initiative for admin", async () => {
      // Create a test initiative to delete
      const testInitiative = await prisma.initiative.create({
        data: {
          title: "Initiative to Delete",
          description: "This will be deleted",
        },
      });

      const initiativeId = testInitiative.id;

      await request(app)
        .delete(`/v1/initiatives/${initiativeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Verify the initiative is actually deleted
      const deletedInitiative = await prisma.initiative.findUnique({
        where: { id: initiativeId },
      });

      expect(deletedInitiative).toBeNull();
    });

    it("should delete an initiative for manager", async () => {
      // Create a test initiative to delete
      const testInitiative = await prisma.initiative.create({
        data: {
          title: "Initiative to Delete by Manager",
          description: "This will be deleted by manager",
        },
      });

      const initiativeId = testInitiative.id;

      await request(app)
        .delete(`/v1/initiatives/${initiativeId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      // Verify the initiative is actually deleted
      const deletedInitiative = await prisma.initiative.findUnique({
        where: { id: initiativeId },
      });

      expect(deletedInitiative).toBeNull();
    });

    it("should return 404 for non-existent initiative", async () => {
      await request(app)
        .delete("/v1/initiatives/999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });

    it("should reject access without authentication", async () => {
      await request(app)
        .delete(`/v1/initiatives/${testInitiativeId}`)
        .expect(401);
    });
  });

  describe("POST /initiatives with media", () => {
    it("should create an initiative with an image", async () => {
      // Create a small test image (1x1 transparent PNG)
      const testImagePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "test-initiative-image.png",
      );
      const buffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      );
      fs.writeFileSync(testImagePath, buffer);

      const response = await request(app)
        .post("/v1/initiatives")
        .attach("media", testImagePath)
        .field("title", "Initiative With Image")
        .field("description", "This initiative has an image")
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe("Initiative With Image");
      expect(response.body.mediaUrl).toContain("/uploads/");
      expect(response.body.mediaType).toBe("image");

      // Cleanup
      fs.unlinkSync(testImagePath);
    });

    it("should create an initiative without media", async () => {
      const initiativeData = {
        title: "Initiative Without Media",
        description: "This initiative has no media",
      };

      const response = await request(app)
        .post("/v1/initiatives")
        .send(initiativeData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.title).toBe("Initiative Without Media");
      expect(response.body.mediaUrl).toBeNull();
      expect(response.body.mediaType).toBeNull();
    });

    it("should reject invalid file type", async () => {
      // Create a test file with invalid type
      const testFilePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "test-initiatives-file.txt",
      );
      fs.writeFileSync(testFilePath, "invalid content");

      const response = await request(app)
        .post("/v1/initiatives")
        .attach("media", testFilePath)
        .field("title", "Invalid File Type")
        .field("description", "This should fail")
        .expect(400);

      expect(response.body.error).toContain("Invalid file type");

      // Cleanup
      fs.unlinkSync(testFilePath);
    });
  });

  describe("PATCH /initiatives/:id with media", () => {
    it("should update an initiative with new media", async () => {
      // Create a small test image
      const testImagePath = path.join(
        __dirname,
        "..",
        "..",
        "..",
        "test-initiative-image2.png",
      );
      const buffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "base64",
      );
      fs.writeFileSync(testImagePath, buffer);

      const response = await request(app)
        .patch(`/v1/initiatives/${testInitiativeId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .attach("media", testImagePath)
        .field("title", "Updated Initiative With Media")
        .expect(200);

      expect(response.body.title).toBe("Updated Initiative With Media");
      expect(response.body.mediaUrl).toContain("/uploads/");
      expect(response.body.mediaType).toBe("image");

      // Cleanup
      fs.unlinkSync(testImagePath);
    });
  });
});
