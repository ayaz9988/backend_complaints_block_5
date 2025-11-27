import request from "supertest";
import { createServer } from "../../server";
import { createTestUser } from "./../helpers";
import { signAccessToken } from "../../lib/jwt";
import config from "../../config";
import prisma from "../../prisma"; // Import Prisma for direct DB manipulation in a test

const app = createServer();

describe("GET /v1/auth/current", () => {
  // Happy Path Tests
  describe("when a valid token is provided", () => {
    it("should return the current manager's info with a null neighborhood", async () => {
      const manager = await createTestUser(
        "manager.current@example.com",
        "password",
        "manager",
        true,
        "Manager Current",
      );

      const managerToken = signAccessToken(
        { sub: manager.id, role: manager.role, email: manager.email },
        config.ACCESS_SECRET,
        config.ACCESS_EXPIRES,
      );

      const response = await request(app)
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
      const admin = await createTestUser(
        "admin.current@example.com",
        "password",
        "admin",
        true,
        "Admin Current",
      );

      const adminToken = signAccessToken(
        { sub: admin.id, role: admin.role, email: admin.email },
        config.ACCESS_SECRET,
        config.ACCESS_EXPIRES,
      );

      const response = await request(app)
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
      const mukhtar = await prisma.user.create({
        data: {
          name: "Mukhtar Current",
          email: "mukhtar.current@example.com",
          passwordHash: "dummy-hash", // Not used in this test
          role: "mukhtar",
          is_active: true,
          neighborhood: "Testville",
        },
      });

      const mukhtarToken = signAccessToken(
        { sub: mukhtar.id, role: mukhtar.role, email: mukhtar.email },
        config.ACCESS_SECRET,
        config.ACCESS_EXPIRES,
      );

      const response = await request(app)
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
      await prisma.user.delete({ where: { id: mukhtar.id } });
    });
  });

  // Error Case Tests
  describe("when authentication fails", () => {
    it("should return 401 if no authorization token is provided", async () => {
      const response = await request(app).get("/v1/auth/current");
      expect(response.status).toBe(401);
    });

    it("should return 401 if an invalid token is provided", async () => {
      const response = await request(app)
        .get("/v1/auth/current")
        .set("Authorization", "Bearer invalid-token-string");
      expect(response.status).toBe(401);
    });

    it("should return 404 if the token is valid but the user does not exist", async () => {
      const user = await createTestUser(
        "ghost@example.com",
        "password",
        "admin",
        true,
        "Ghost User",
      );

      const token = signAccessToken(
        { sub: user.id, role: user.role, email: user.email },
        config.ACCESS_SECRET,
        config.ACCESS_EXPIRES,
      );

      // Delete the user from the DB after the token has been created
      await prisma.user.delete({ where: { id: user.id } });

      const response = await request(app)
        .get("/v1/auth/current")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("User not found");
    });
  });
});
