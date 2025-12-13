"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
// src/tests/complaints/complaints-core.test.ts
const supertest_1 = __importDefault(require("supertest"));
const helpers_1 = require("../helpers");
const server_1 = require("../../server");
const prisma_1 = __importDefault(require("../../prisma"));
const app = (0, server_1.createServer)();
describe("Complaints API", () => {
  let adminToken;
  let managerToken;
  let mukhtarToken;
  let testComplaintId;
  let testTrackingTag;
  beforeAll(async () => {
    // First, delete any refresh tokens associated with our test users
    await prisma_1.default.refreshToken.deleteMany({
      where: {
        user: {
          email: {
            in: ["admin@test.com", "manager@test.com", "mukhtar@test.com"],
          },
        },
      },
    });
    // Clean up any existing test users before creating new ones
    await prisma_1.default.user.deleteMany({
      where: {
        email: {
          in: ["admin@test.com", "manager@test.com", "mukhtar@test.com"],
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
    const mukhtarUser = await (0, helpers_1.createTestUser)(
      "mukhtar@test.com",
      "password123",
      "mukhtar",
      true,
      "Test Mukhtar",
      "Test Neighborhood",
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
    const mukhtarLogin = await (0, helpers_1.loginUser)(
      app,
      "mukhtar@test.com",
      "password123",
    );
    adminToken = adminLogin.body.accessToken;
    managerToken = managerLogin.body.accessToken;
    mukhtarToken = mukhtarLogin.body.accessToken;
  });
  beforeEach(async () => {
    // Clean up any existing test complaints before creating a new one
    await prisma_1.default.complaints.deleteMany({
      where: {
        trackingTag: {
          in: [
            "test-tracking-tag-123",
            "high-priority-1",
            "mid-priority-1",
            "low-priority-1",
            "already-accepted",
            "to-refuse",
            "to-refuse-2",
            "already-refused",
            "to-delete-tag",
            "to-soft-delete-tag",
          ],
        },
      },
    });
    // Create a test complaint for use in tests
    const testComplaint = await prisma_1.default.complaints.create({
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
      };
      const response = await (0, supertest_1.default)(app)
        .post("/v1/complaints")
        .send(complaintData)
        .expect(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("trackingTag");
      expect(response.body.submitterName).toBe(complaintData.submitterName);
      expect(response.body.complaint_status).toBe("pending");
      expect(response.body.priority).toBeNull();
      expect(response.body.estimatedReviewTime).toBeNull();
    });
    it("should create complaint without priority when not provided", async () => {
      const complaintData = {
        submitterName: "Jane Smith",
        contactNumber: "5551234567",
        description: "Water leak in street",
        location: "456 Oak Ave",
        neighborhood: "Uptown",
        complaint_type: "water",
      };
      const response = await (0, supertest_1.default)(app)
        .post("/v1/complaints")
        .send(complaintData)
        .expect(201);
      expect(response.body.priority).toBeNull();
      expect(response.body.estimatedReviewTime).toBeNull();
    });
    it("should create a complaint with a suggested solution", async () => {
      const complaintData = {
        submitterName: "Alice Johnson",
        contactNumber: "5559876543",
        description: "Pothole in street",
        location: "789 Oak Street",
        neighborhood: "Westside",
        complaint_type: "infrastructure",
        suggestedSolution:
          "The city should fill the pothole with asphalt and place a warning sign until it's fixed.",
      };
      const response = await (0, supertest_1.default)(app)
        .post("/v1/complaints")
        .send(complaintData)
        .expect(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("trackingTag");
      expect(response.body.submitterName).toBe(complaintData.submitterName);
      expect(response.body.complaint_status).toBe("pending");
      expect(response.body.suggestedSolution).toBe(
        complaintData.suggestedSolution,
      );
      expect(response.body.priority).toBeNull();
      expect(response.body.estimatedReviewTime).toBeNull();
    });
    it("should create a complaint without a suggested solution", async () => {
      const complaintData = {
        submitterName: "Bob Wilson",
        contactNumber: "5551234567",
        description: "Street light is out",
        location: "321 Pine Avenue",
        neighborhood: "Eastside",
        complaint_type: "infrastructure",
        // No suggestedSolution field
      };
      const response = await (0, supertest_1.default)(app)
        .post("/v1/complaints")
        .send(complaintData)
        .expect(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("trackingTag");
      expect(response.body.submitterName).toBe(complaintData.submitterName);
      expect(response.body.complaint_status).toBe("pending");
      expect(response.body.suggestedSolution).toBeNull();
      expect(response.body.priority).toBeNull();
      expect(response.body.estimatedReviewTime).toBeNull();
    });
  });
  describe("GET /complaints/track/:trackingTag", () => {
    it("should return a complaint by tracking tag", async () => {
      const response = await (0, supertest_1.default)(app)
        .get(`/v1/complaints/track/${testTrackingTag}`)
        .expect(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("trackingTag", testTrackingTag);
      expect(response.body).not.toHaveProperty("notes"); // Notes should be omitted
    });
    it("should return 404 for non-existent tracking tag", async () => {
      await (0, supertest_1.default)(app)
        .get("/v1/complaints/track/non-existent-tag")
        .expect(404);
    });
  });
  describe("GET /complaints", () => {
    it("should return high priority complaints for manager", async () => {
      // Create test complaints with different priorities
      await prisma_1.default.complaints.createMany({
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
      const response = await (0, supertest_1.default)(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      expect(response.body.length).toBeGreaterThan(0);
      // Manager should only see high priority complaints
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.body.every((complaint) => complaint.priority === "high"),
      ).toBe(true);
    });
    it("should return mid priority complaints for admin", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      // Admin should only see mid priority complaints
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.body.every((complaint) => complaint.priority === "mid"),
      ).toBe(true);
    });
    it("should return low priority complaints for mukhtar", async () => {
      const response = await (0, supertest_1.default)(app)
        .get("/v1/complaints")
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(200);
      // Mukhtar should only see low priority complaints
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response.body.every((complaint) => complaint.priority === "low"),
      ).toBe(true);
    });
  });
  describe("GET /complaints/:id", () => {
    it("should return a specific complaint", async () => {
      const response = await (0, supertest_1.default)(app)
        .get(`/v1/complaints/${testComplaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toHaveProperty("id", testComplaintId);
      expect(response.body).toHaveProperty("trackingTag", testTrackingTag);
    });
    it("should return 404 for non-existent complaint", async () => {
      await (0, supertest_1.default)(app)
        .get("/v1/complaints/999999")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });
  describe("PATCH /complaints/:id/accept", () => {
    it("should accept a complaint with solution info", async () => {
      const solutionData = {
        solutionInfo: "Fixed the noise issue by talking to neighbors",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${testComplaintId}/accept`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(solutionData)
        .expect(200);
      expect(response.body.complaint_status).toBe("accepted");
      expect(response.body.solutionInfo).toBe(solutionData.solutionInfo);
      expect(response.body.refusalReason).toBeNull();
    });
    it("should reject accepting a complaint without solution info", async () => {
      await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${testComplaintId}/accept`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({}) // Missing solutionInfo
        .expect(400);
    });
    it("should reject accepting a complaint that is not pending", async () => {
      // Create a complaint that's already accepted
      const testComplaint = await prisma_1.default.complaints.create({
        data: {
          submitterName: "Already Accepted",
          contactNumber: "1234567890",
          description: "Already accepted complaint",
          location: "Test location",
          neighborhood: "Test Neighborhood",
          complaint_type: "noise",
          priority: "mid",
          trackingTag: "already-accepted",
          estimatedReviewTime: "3-5 business days",
          complaint_status: "accepted",
          solutionInfo: "Already solved",
        },
      });
      const complaintId = testComplaint.id.toString();
      await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${complaintId}/accept`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ solutionInfo: "New solution" })
        .expect(400);
    });
  });
  describe("PATCH /complaints/:id/refuse", () => {
    it("should refuse a complaint with refusal reason", async () => {
      // Create a new complaint for this test
      const testComplaint = await prisma_1.default.complaints.create({
        data: {
          submitterName: "To Refuse",
          contactNumber: "1234567890",
          description: "To be refused",
          location: "Test location",
          neighborhood: "Test Neighborhood",
          complaint_type: "noise",
          priority: "mid",
          trackingTag: "to-refuse",
          estimatedReviewTime: "3-5 business days",
          complaint_status: "pending",
        },
      });
      const complaintId = testComplaint.id.toString();
      const refusalData = {
        refusalReason: "Complaint is outside our jurisdiction",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${complaintId}/refuse`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(refusalData)
        .expect(200);
      expect(response.body.complaint_status).toBe("refused");
      expect(response.body.refusalReason).toBe(refusalData.refusalReason);
      expect(response.body.solutionInfo).toBeNull();
    });
    it("should reject refusing a complaint without refusal reason", async () => {
      // Create a new complaint for this test
      const testComplaint = await prisma_1.default.complaints.create({
        data: {
          submitterName: "To Refuse 2",
          contactNumber: "1234567890",
          description: "To be refused 2",
          location: "Test location",
          neighborhood: "Test Neighborhood",
          complaint_type: "noise",
          priority: "mid",
          trackingTag: "to-refuse-2",
          estimatedReviewTime: "3-5 business days",
          complaint_status: "pending",
        },
      });
      const complaintId = testComplaint.id.toString();
      await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${complaintId}/refuse`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({}) // Missing refusalReason
        .expect(400);
    });
    it("should reject refusing a complaint that is not pending", async () => {
      // Create a complaint that's already refused
      const testComplaint = await prisma_1.default.complaints.create({
        data: {
          submitterName: "Already Refused",
          contactNumber: "1234567890",
          description: "Already refused complaint",
          location: "Test location",
          neighborhood: "Test Neighborhood",
          complaint_type: "noise",
          priority: "mid",
          trackingTag: "already-refused",
          estimatedReviewTime: "3-5 business days",
          complaint_status: "refused",
          refusalReason: "Already refused",
        },
      });
      const complaintId = testComplaint.id.toString();
      await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${complaintId}/refuse`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ refusalReason: "New refusal reason" })
        .expect(400);
    });
  });
  describe("PATCH /complaints/:id", () => {
    it("should update complaint priority", async () => {
      const updateData = {
        priority: "high",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${testComplaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      expect(response.body.priority).toBe("high");
    });
    it("should update complaint notes", async () => {
      const updateData = {
        notes: "Internal notes about this complaint",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${testComplaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      expect(response.body.notes).toBe(updateData.notes);
    });
    it("should update estimated review time", async () => {
      const updateData = {
        estimatedReviewTime: "2-3 business days",
      };
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${testComplaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);
      expect(response.body.estimatedReviewTime).toBe(
        updateData.estimatedReviewTime,
      );
    });
  });
  describe("DELETE /complaints/:id", () => {
    it("should hard delete a complaint for manager", async () => {
      // Create a test complaint to delete
      const testComplaint = await prisma_1.default.complaints.create({
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
      await (0, supertest_1.default)(app)
        .delete(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${managerToken}`)
        .expect(200);
      // Verify the complaint is actually deleted
      const deletedComplaint = await prisma_1.default.complaints.findUnique({
        where: { id: BigInt(complaintId) },
      });
      expect(deletedComplaint).toBeNull();
    });
    it("should soft delete a complaint for mukhtar", async () => {
      // Create a test complaint to soft delete
      const testComplaint = await prisma_1.default.complaints.create({
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
      await (0, supertest_1.default)(app)
        .delete(`/v1/complaints/${complaintId}`)
        .set("Authorization", `Bearer ${mukhtarToken}`)
        .expect(200);
      // Verify the complaint is soft deleted (has deletedAt)
      const softDeletedComplaint = await prisma_1.default.complaints.findUnique(
        {
          where: { id: BigInt(complaintId) },
        },
      );
      expect(softDeletedComplaint).not.toBeNull();
      expect(softDeletedComplaint?.deletedAt).not.toBeNull();
    });
    it("should return 403 for admin trying to delete", async () => {
      await (0, supertest_1.default)(app)
        .delete(`/v1/complaints/${testComplaintId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });
  });
  describe("PATCH /complaints/:id/priority", () => {
    it("should set complaint priority to high", async () => {
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${testComplaintId}/priority`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ priority: "high" })
        .expect(200);
      expect(response.body.priority).toBe("high");
      expect(response.body.estimatedReviewTime).toBe("1-2 business days");
    });
    it("should set complaint priority to mid", async () => {
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${testComplaintId}/priority`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ priority: "mid" })
        .expect(200);
      expect(response.body.priority).toBe("mid");
      expect(response.body.estimatedReviewTime).toBe("3-5 business days");
    });
    it("should set complaint priority to low", async () => {
      const response = await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${testComplaintId}/priority`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ priority: "low" })
        .expect(200);
      expect(response.body.priority).toBe("low");
      expect(response.body.estimatedReviewTime).toBe("1 week");
    });
    it("should return 400 for invalid priority", async () => {
      await (0, supertest_1.default)(app)
        .patch(`/v1/complaints/${testComplaintId}/priority`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ priority: "invalid" })
        .expect(400);
    });
    it("should return 404 for non-existent complaint", async () => {
      await (0, supertest_1.default)(app)
        .patch("/v1/complaints/999999/priority")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ priority: "high" })
        .expect(404);
    });
  });
});
