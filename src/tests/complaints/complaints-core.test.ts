import request from "supertest";
import { createTestUser, loginUser, UserRole } from "./../helpers";
import { createServer } from "../../server";
import prisma from "../../prisma";

const app = createServer();

describe("Complaints API", () => {
  let adminToken: string;
  let managerToken: string;
  let mukhtarToken: string;
  let testComplaintId: string;
  let testTrackingTag: string;

  beforeAll(async () => {
    // Create test users for each role
    const adminUser = await createTestUser("admin@test.com", "password123", "admin");
    const managerUser = await createTestUser("manager@test.com", "password123", "manager");
    const mukhtarUser = await createTestUser("mukhtar@test.com", "password123", "mukhtar", true, "Test Mukhtar", "Test Neighborhood");

    // Login to get tokens
    const adminLogin = await loginUser(app, "admin@test.com", "password123");
    const managerLogin = await loginUser(app, "manager@test.com", "password123");
    const mukhtarLogin = await loginUser(app, "mukhtar@test.com", "password123");

    adminToken = adminLogin.body.accessToken;
    managerToken = managerLogin.body.accessToken;
    mukhtarToken = mukhtarLogin.body.accessToken;
  });

  beforeEach(async () => {
    // Create a test complaint for use in tests
    const testComplaint = await prisma.complaints.create({
      data: {
        submitterName: "Test Submitter",
        contactNumber: "1234567890",
        description: "Test complaint description",
        location: "Test location",
        neighborhood: "Test Neighborhood",
        complaint_type: "noise",
        priority: "mid",
        trackingTag: "test-tracking-tag-123",
        estimatedReviewTime: "3-5 business days",
        complaint_status: "pending",
      },
    });

    testComplaintId = testComplaint.id.toString();
    testTrackingTag = testComplaint.trackingTag;
  });

  describe("POST /complaints", () => {
    it("should create a new complaint", async () => {
      const complaintData = {
        submitterName: "John Doe",
        contactNumber: "9876543210",
        description: "Noise complaint from neighbors",
        location: "123 Main St",
        neighborhood: "Downtown",
        complaint_type: "noise",
        priority: "high",
      };

      const response = await request(app)
        .post("/v1/complaints")
        .send(complaintData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("trackingTag");
      expect(response.body).toHaveProperty("estimatedReviewTime", "1-2 business days");
      expect(response.body.submitterName).toBe(complaintData.submitterName);
      expect(response.body.complaint_status).toBe("pending");
    });

    it("should use default priority when not provided", async () => {
      const complaintData = {
        submitterName: "Jane Smith",
        contactNumber: "5551234567",
        description: "Water leak in the street",
        location: "456 Oak Ave",
        neighborhood: "Uptown",
        complaint_type: "water",
      };

      const response = await request(app)
        .post("/v1/complaints")
        .send(complaintData)
        .expect(201);

      expect(response.body.priority).toBe("mid");
      expect(response.body.estimatedReviewTime).toBe("3-5 business days");
    });
  });

  describe("GET /complaints/track/:trackingTag", () => {
    it("should return a complaint by tracking tag", async () => {
      const response = await request(app)
        .get(`/v1/complaints/track/${testTrackingTag}`)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("trackingTag", testTrackingTag);
      expect(response.body).not.toHaveProperty("notes"); // Notes should be omitted
    });

    it("should return 404 for non-existent tracking tag", async () => {
      await request(app)
        .get("/v1/complaints/track/non-existent-tag")
        .expect(404);
    });
  });

  describe("GET /complaints", () => {
    it("should return high priority complaints for manager", async () => {
      // Create test complaints with different priorities
      await prisma.complaints.createMany({
        data: [
          {
            submitterName: "High Priority 1",
            contactNumber: "1111111111",
            description: "High priority complaint",
            location: "Location 1",
            neighborhood: "Neighborhood 1",
            complaint_type: "noise",
            priority: "high",
            trackingTag: "high-priority-1",
            estimatedReviewTime: "1-2 business days",
            complaint_status: "pending",
          },
          {
            submitterName: "Mid Priority 1",
            contactNumber: "2222222222",
            description: "Mid priority complaint",
            location: "Location 2",
            neighborhood: "Neighborhood 2",
            complaint_type: "noise",
            priority: "mid",
            trackingTag: "mid-priority-1",
            estimatedReviewTime: "3-5 business days",
            complaint_status: "pending",
          },
          {
            submitterName: "Low Priority 1",
            contactNumber: "3333333333",
            description: "Low priority complaint",
            location: "Location 3",
            neighborhood: "Neighborhood 3",
            complaint_type: "noise",
            priority: "low",
            trackingTag: "low-priority-1",
            estimatedReviewTime: "1 week",
            complaint_status: "pending",
          },
        ],
      });

      const response = await request(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      // Manager should only see high priority complaints
      expect(response.body.every((complaint: any) => complaint.priority === "high")).toBe(true);
    });

    it("should return mid priority complaints for admin", async () => {
      const response = await request(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // Admin should only see mid priority complaints
      expect(response.body.every((complaint: any) => complaint.priority === "mid")).toBe(true);
    });

    it("should return low priority complaints for mukhtar", async () => {
      const response = await request(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(200);

      // Mukhtar should only see low priority complaints
      expect(response.body.every((complaint: any) => complaint.priority === "low")).toBe(true);
    });
  });

  describe("GET /complaints/:id", () => {
    it("should return a specific complaint", async () => {
      const response = await request(app)
        .get(`/v1/complaints/${testComplaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testComplaintId);
      expect(response.body).toHaveProperty("trackingTag", testTrackingTag);
    });

    it("should return 404 for non-existent complaint", async () => {
      await request(app)
        .get("/v1/complaints/999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("PATCH /complaints/:id", () => {
    it("should update complaint status to accepted with solution info", async () => {
      const updateData = {
        complaint_status: "accepted",
        solutionInfo: "Fixed the noise issue by talking to neighbors",
      };

      const response = await request(app)
        .patch(`/v1/complaints/${testComplaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.complaint_status).toBe("accepted");
      expect(response.body.solutionInfo).toBe(updateData.solutionInfo);
      expect(response.body.refusalReason).toBeNull();
    });

    it("should update complaint status to refused with refusal reason", async () => {
      // Create a new complaint for this test
      const testComplaint = await prisma.complaints.create({
        data: {
          submitterName: "Test Submitter 2",
          contactNumber: "1234567890",
          description: "Test complaint description 2",
          location: "Test location 2",
          neighborhood: "Test Neighborhood 2",
          complaint_type: "noise",
          priority: "mid",
          trackingTag: "test-tracking-tag-456",
          estimatedReviewTime: "3-5 business days",
          complaint_status: "pending",
        },
      });

      const complaintId = testComplaint.id.toString();

      const updateData = {
        complaint_status: "refused",
        refusalReason: "Complaint is outside our jurisdiction",
      };

      const response = await request(app)
        .patch(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.complaint_status).toBe("refused");
      expect(response.body.refusalReason).toBe(updateData.refusalReason);
      expect(response.body.solutionInfo).toBeNull();
    });

    it("should reject updating status to accepted without solution info", async () => {
      // Create a new complaint for this test
      const testComplaint = await prisma.complaints.create({
        data: {
          submitterName: "Test Submitter 3",
          contactNumber: "1234567890",
          description: "Test complaint description 3",
          location: "Test location 3",
          neighborhood: "Test Neighborhood 3",
          complaint_type: "noise",
          priority: "mid",
          trackingTag: "test-tracking-tag-789",
          estimatedReviewTime: "3-5 business days",
          complaint_status: "pending",
        },
      });

      const complaintId = testComplaint.id.toString();

      const updateData = {
        complaint_status: "accepted",
        // Missing solutionInfo
      };

      await request(app)
        .patch(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });

    it("should reject updating status to refused without refusal reason", async () => {
      // Create a new complaint for this test
      const testComplaint = await prisma.complaints.create({
        data: {
          submitterName: "Test Submitter 4",
          contactNumber: "1234567890",
          description: "Test complaint description 4",
          location: "Test location 4",
          neighborhood: "Test Neighborhood 4",
          complaint_type: "noise",
          priority: "mid",
          trackingTag: "test-tracking-tag-101",
          estimatedReviewTime: "3-5 business days",
          complaint_status: "pending",
        },
      });

      const complaintId = testComplaint.id.toString();

      const updateData = {
        complaint_status: "refused",
        // Missing refusalReason
      };

      await request(app)
        .patch(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });

    it("should prevent reverting a complaint back to pending", async () => {
      // Create a new complaint for this test
      const testComplaint = await prisma.complaints.create({
        data: {
          submitterName: "Test Submitter 5",
          contactNumber: "1234567890",
          description: "Test complaint description 5",
          location: "Test location 5",
          neighborhood: "Test Neighborhood 5",
          complaint_type: "noise",
          priority: "mid",
          trackingTag: "test-tracking-tag-202",
          estimatedReviewTime: "3-5 business days",
          complaint_status: "accepted",
          solutionInfo: "Test solution",
        },
      });

      const complaintId = testComplaint.id.toString();

      const updateData = {
        complaint_status: "pending",
      };

      await request(app)
        .patch(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);
    });
  });

  describe("DELETE /complaints/:id", () => {
    it("should hard delete a complaint for manager", async () => {
      // Create a test complaint to delete
      const testComplaint = await prisma.complaints.create({
        data: {
          submitterName: "To Delete",
          contactNumber: "1234567890",
          description: "This will be deleted",
          location: "Delete Location",
          neighborhood: "Delete Neighborhood",
          complaint_type: "noise",
          priority: "high",
          trackingTag: "to-delete-tag",
          estimatedReviewTime: "1-2 business days",
          complaint_status: "pending",
        },
      });

      const complaintId = testComplaint.id.toString();

      await request(app)
        .delete(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);

      // Verify the complaint is actually deleted
      const deletedComplaint = await prisma.complaints.findUnique({
        where: { id: BigInt(complaintId) },
      });

      expect(deletedComplaint).toBeNull();
    });

    it("should soft delete a complaint for mukhtar", async () => {
      // Create a test complaint to soft delete
      const testComplaint = await prisma.complaints.create({
        data: {
          submitterName: "To Soft Delete",
          contactNumber: "1234567890",
          description: "This will be soft deleted",
          location: "Soft Delete Location",
          neighborhood: "Soft Delete Neighborhood",
          complaint_type: "noise",
          priority: "low",
          trackingTag: "to-soft-delete-tag",
          estimatedReviewTime: "1 week",
          complaint_status: "pending",
        },
      });

      const complaintId = testComplaint.id.toString();

      await request(app)
        .delete(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(200);

      // Verify the complaint is soft deleted (has deletedAt)
      const softDeletedComplaint = await prisma.complaints.findUnique({
        where: { id: BigInt(complaintId) },
      });

      expect(softDeletedComplaint).not.toBeNull();
      expect(softDeletedComplaint?.deletedAt).not.toBeNull();
    });

    it("should return 403 for admin trying to delete", async () => {
      await request(app)
        .delete(`/v1/complaints/${testComplaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });
  });
});