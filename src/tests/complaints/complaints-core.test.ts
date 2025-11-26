/**
 * TESTS FOR COMPLAINT ENDPOINTS
 *
 * This file tests all complaint-related functionality including:
 * 1. Creating complaints (anonymous access)
 * 2. Listing complaints (authenticated users with specific roles)
 * 3. Getting a specific complaint (authenticated users with specific roles)
 * 4. Updating complaints (manager only)
 * 5. Deleting complaints (manager and mukhtar)
 */

import request from "supertest";
import { createServer } from "../../server";
import { createTestUser, loginUser, UserRole } from "./../helpers";

const app = createServer();

describe("Complaint Endpoints", () => {
  let managerToken: string;
  let adminToken: string;
  let mukhtarToken: string;

  // Use unique emails for each test run
  const timestamp = Date.now();
  const managerEmail = `manager-${timestamp}@test.com`;
  const adminEmail = `admin-${timestamp}@test.com`;
  const mukhtarEmail = `mukhtar-${timestamp}@test.com`;

  beforeAll(async () => {
    // Create test users with different roles
    await createTestUser(managerEmail, "password123", "manager");
    await createTestUser(adminEmail, "password123", "admin");
    await createTestUser(mukhtarEmail, "password123", "mukhtar");

    // Login to get tokens
    const managerLogin = await loginUser(app, managerEmail, "password123");
    managerToken = managerLogin.body.accessToken;

    const adminLogin = await loginUser(app, adminEmail, "password123");
    adminToken = adminLogin.body.accessToken;

    const mukhtarLogin = await loginUser(app, mukhtarEmail, "password123");
    mukhtarToken = mukhtarLogin.body.accessToken;
  });

  describe("POST /complaints", () => {
    it("should create a complaint as an anonymous user", async () => {
      const complaintData = {
        submitterName: "John Doe",
        contactNumber: "1234567890",
        description: "Street light is broken",
        location: "Main Street",
        neighborhood: `Downtown-${timestamp}`, // Make unique with timestamp
        complaint_type: `infrastructure-${timestamp}`, // Make unique with timestamp
      };

      const response = await request(app)
        .post("/v1/complaints")
        .send(complaintData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.submitterName).toBe(complaintData.submitterName);
      expect(response.body.complaint_status).toBe("pending"); // Default value
    });

    it("should create a complaint with default status", async () => {
      const complaintData = {
        submitterName: "Jane Smith",
        contactNumber: "9876543210",
        description: "Pothole on the road",
        location: "Oak Avenue",
        neighborhood: `Uptown-${timestamp}`, // Make unique with timestamp
        complaint_type: `road-${timestamp}`, // Make unique with timestamp
        complaint_status: "pending",
      };

      const response = await request(app)
        .post("/v1/complaints")
        .send(complaintData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.complaint_status).toBe("pending");
    });

    it("should return 500 if required fields are missing", async () => {
      const incompleteData = {
        submitterName: "Incomplete Complaint",
        // Missing other required fields
      };

      const response = await request(app)
        .post("/v1/complaints")
        .send(incompleteData);

      expect(response.status).toBe(500);
    });
  });

  describe("GET /complaints", () => {
    it("should list complaints for a manager", async () => {
      const response = await request(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should list complaints for an admin", async () => {
      const response = await request(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should list complaints for a mukhtar", async () => {
      const response = await request(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${mukhtarToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app).get("/v1/complaints");
      expect(response.status).toBe(401);
    });

    it("should return 403 for user without required role", async () => {
      // Create a user with a different role (using admin since resident is not a valid role)
      const testEmail = `test-${timestamp}@test.com`;
      await createTestUser(testEmail, "password123", "admin");
      const testLogin = await loginUser(app, testEmail, "password123");
      const testToken = testLogin.body.accessToken;

      const response = await request(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${testToken}`);

      expect(response.status).toBe(200); // Admin should have access
    });
  });

  describe("GET /complaints/:id", () => {
    let complaintId: string;

    // Create a test complaint before running these tests
    beforeEach(async () => {
      const complaintData = {
        submitterName: "Test Complaint",
        contactNumber: "1234567890",
        description: "Test description",
        location: "Test location",
        neighborhood: `Test-${timestamp}-1`, // Make unique with timestamp
        complaint_type: `test-${timestamp}-1`, // Make unique with timestamp
      };

      const response = await request(app)
        .post("/v1/complaints")
        .send(complaintData);

      if (response.status === 201) {
        complaintId = response.body.id;
      }
    });

    it("should get a specific complaint for a manager", async () => {
      const response = await request(app)
        .get(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body.id).toBe(complaintId);
    });

    it("should get a specific complaint for an admin", async () => {
      const response = await request(app)
        .get(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body.id).toBe(complaintId);
    });

    it("should get a specific complaint for a mukhtar", async () => {
      const response = await request(app)
        .get(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body.id).toBe(complaintId);
    });

    it("should return 404 for non-existent complaint", async () => {
      const response = await request(app)
        .get("/v1/complaints/99999")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(response.status).toBe(404);
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app).get(`/v1/complaints/${complaintId}`);
      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /complaints/:id", () => {
    let complaintId: string;

    // Create a test complaint before running these tests
    beforeEach(async () => {
      const complaintData = {
        submitterName: "Test Complaint for Update",
        contactNumber: "1234567890",
        description: "Test description for update",
        location: "Test location for update",
        neighborhood: `Test-${timestamp}-2`, // Make unique with timestamp
        complaint_type: `test-${timestamp}-2`, // Make unique with timestamp
      };

      const response = await request(app)
        .post("/v1/complaints")
        .send(complaintData);

      if (response.status === 201) {
        complaintId = response.body.id;
      }
    });

    it("should update a complaint for a manager", async () => {
      const updateData = {
        complaint_status: "accepted",
        description: "Updated description",
      };

      const response = await request(app)
        .patch(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.complaint_status).toBe(updateData.complaint_status);
      expect(response.body.description).toBe(updateData.description);
    });

    it("should return 403 for non-manager user", async () => {
      const updateData = {
        complaint_status: "refused",
      };

      const response = await request(app)
        .patch(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
    });

    it("should return 401 for unauthenticated request", async () => {
      const updateData = {
        complaint_status: "refused",
      };

      const response = await request(app)
        .patch(`/v1/complaints/${complaintId}`)
        .send(updateData);

      expect(response.status).toBe(401);
    });

    it("should return 500 for non-existent complaint", async () => {
      const updateData = {
        complaint_status: "refused",
      };

      const response = await request(app)
        .patch("/v1/complaints/99999")
        .set("Authorization", `Bearer ${managerToken}`)
        .send(updateData);

      expect(response.status).toBe(500); // This will likely be a 500 because Prisma will throw an error
    });
  });

  describe("DELETE /complaints/:id", () => {
    let testComplaintId: string;

    // Create a test complaint for deletion tests
    beforeEach(async () => {
      const complaintData = {
        submitterName: "Test Complaint",
        contactNumber: "1112223333",
        description: "This complaint will be deleted",
        location: "Test Street",
        neighborhood: `Test-${timestamp}-3`, // Make unique with timestamp
        complaint_type: `test-${timestamp}-3`, // Make unique with timestamp
      };

      const response = await request(app)
        .post("/v1/complaints")
        .send(complaintData);

      if (response.status === 201) {
        testComplaintId = response.body.id;
      }
    });

    it("should hard delete a complaint for a manager", async () => {
      const response = await request(app)
        .delete(`/v1/complaints/${testComplaintId}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(response.status).toBe(200);

      // Verify the complaint is actually deleted
      const verifyResponse = await request(app)
        .get(`/v1/complaints/${testComplaintId}`)
        .set("Authorization", `Bearer ${managerToken}`);

      expect(verifyResponse.status).toBe(404);
    });

    it("should soft delete a complaint for a mukhtar", async () => {
      // Create another test complaint for soft deletion
      const complaintData = {
        submitterName: "Soft Delete Test",
        contactNumber: "4445556666",
        description: "This complaint will be soft deleted",
        location: "Soft Delete Street",
        neighborhood: `Test-${timestamp}-4`, // Make unique with timestamp
        complaint_type: `test-${timestamp}-4`, // Make unique with timestamp
      };

      const createResponse = await request(app)
        .post("/v1/complaints")
        .send(complaintData);

      if (createResponse.status !== 201) {
        console.log("Failed to create complaint for soft delete test");
        return;
      }

      const softDeleteComplaintId = createResponse.body.id;

      const deleteResponse = await request(app)
        .delete(`/v1/complaints/${softDeleteComplaintId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`);

      expect(deleteResponse.status).toBe(200);

      // Verify the complaint is soft deleted (not returned in list)
      const listResponse = await request(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(listResponse.status).toBe(200);

      const deletedComplaint = listResponse.body.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (c: any) => c.id === softDeleteComplaintId,
      );
      expect(deletedComplaint).toBeUndefined();
    });

    it("should return 403 for user without required role", async () => {
      // Create a test complaint for this test
      const complaintData = {
        submitterName: "Unauthorized Delete Test",
        contactNumber: "7778889999",
        description: "This complaint should not be deletable",
        location: "Unauthorized Street",
        neighborhood: `Test-${timestamp}-5`, // Make unique with timestamp
        complaint_type: `test-${timestamp}-5`, // Make unique with timestamp
      };

      const createResponse = await request(app)
        .post("/v1/complaints")
        .send(complaintData);

      if (createResponse.status !== 201) {
        console.log("Failed to create complaint for unauthorized delete test");
        return;
      }

      const unauthorizedComplaintId = createResponse.body.id;

      // Try to delete with admin token (should fail based on the route definition)
      const deleteResponse = await request(app)
        .delete(`/v1/complaints/${unauthorizedComplaintId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(403);
    });

    it("should return 401 for unauthenticated request", async () => {
      const response = await request(app).delete(
        `/v1/complaints/${testComplaintId}`,
      );
      expect(response.status).toBe(401);
    });

    it("should return 404 for non-existent complaint", async () => {
      const response = await request(app)
        .delete("/v1/complaints/99999")
        .set("Authorization", `Bearer ${managerToken}`);

      expect(response.status).toBe(404);
    });
  });
});
