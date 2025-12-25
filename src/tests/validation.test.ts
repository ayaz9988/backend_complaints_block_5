import {
  emailSchema,
  passwordSchema,
  nameSchema,
  phoneNumberSchema,
  createComplaintSchema,
  registerSchema,
  validateWithZod,
} from "../validation";
import { Request, Response, NextFunction } from "express";

describe("Validation Schemas", () => {
  describe("emailSchema", () => {
    it("should validate valid email addresses", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
      ];

      validEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(true);
        expect(result.data).toBe(email.toLowerCase().trim());
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user..name@example.com",
        "",
      ];

      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("passwordSchema", () => {
    it("should validate strong passwords", () => {
      const validPasswords = ["password123", "MySecureP@ssw0rd", "123456"];

      validPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(true);
        expect(result.data).toBe(password.trim());
      });
    });

    it("should reject weak passwords", () => {
      const invalidPasswords = ["123", "pass", "", "a".repeat(129)];

      invalidPasswords.forEach((password) => {
        const result = passwordSchema.safeParse(password);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("nameSchema", () => {
    it("should validate names", () => {
      const validNames = ["John Doe", "Jane", "José María", "أحمد"];

      validNames.forEach((name) => {
        const result = nameSchema.safeParse(name);
        expect(result.success).toBe(true);
        expect(result.data).toBe(name.trim());
      });
    });

    it("should reject invalid names", () => {
      const invalidNames = ["", "J", "a".repeat(101)];

      invalidNames.forEach((name) => {
        const result = nameSchema.safeParse(name);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("phoneNumberSchema", () => {
    it("should validate phone numbers", () => {
      const validPhones = [
        "+1234567890",
        "123-456-7890",
        "(123) 456-7890",
        "+1 (555) 123-4567",
        "123 456 7890",
      ];

      validPhones.forEach((phone) => {
        const result = phoneNumberSchema.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid phone numbers", () => {
      const invalidPhones = [
        "123",
        "abc-def-ghij",
        "123-abc-7890",
        "",
        "a".repeat(21),
      ];

      invalidPhones.forEach((phone) => {
        const result = phoneNumberSchema.safeParse(phone);
        expect(result.success).toBe(false);
      });
    });
  });

  describe("createComplaintSchema", () => {
    it("should validate complaint creation", () => {
      const validComplaint = {
        submitterName: "John Doe",
        contactNumber: "123-456-7890",
        description: "This is a test complaint description",
        location: "Test Location",
        neighborhood: "Test Neighborhood",
        complaint_type: "Infrastructure",
        suggestedSolution: "Fix the issue",
      };

      const result = createComplaintSchema.safeParse({
        body: validComplaint,
      });

      expect(result.success).toBe(true);
      expect(result.data?.body.contactNumber).toBe("123-456-7890");
      expect(result.data?.body.description).toBe(
        "This is a test complaint description",
      );
    });

    it("should reject invalid complaint creation", () => {
      const invalidComplaint = {
        submitterName: "J", // Too short
        contactNumber: "123", // Too short
        description: "Short", // Too short
        neighborhood: "Test", // Valid
        complaint_type: "Infrastructure", // Valid
      };

      const result = createComplaintSchema.safeParse({
        body: invalidComplaint,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues).toHaveLength(3);
    });
  });

  describe("registerSchema", () => {
    it("should validate user registration", () => {
      const validRegistration = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "mukhtar",
        neighborhood: "Test Neighborhood",
      };

      const result = registerSchema.safeParse({
        body: validRegistration,
      });

      expect(result.success).toBe(true);
      expect(result.data?.body.email).toBe("john@example.com");
      expect(result.data?.body.neighborhood).toBe("Test Neighborhood");
    });

    it("should reject invalid registration", () => {
      const invalidRegistration = {
        name: "J", // Too short
        email: "invalid-email", // Invalid email
        password: "123", // Too short
        role: "invalid-role", // Invalid role
      };

      const result = registerSchema.safeParse({
        body: invalidRegistration,
      });

      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });
});

describe("Validation Middleware", () => {
  it("should validate request and pass to next middleware", () => {
    const mockReq = {
      body: {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "mukhtar",
        neighborhood: "Test Neighborhood",
      },
      params: {},
      query: {},
      cookies: {},
    } as Request;

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const mockNext = jest.fn() as NextFunction;

    const middleware = validateWithZod(registerSchema);
    middleware(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
    expect(mockReq.body.name).toBe("John Doe");
    expect(mockReq.body.email).toBe("john@example.com");
  });

  it("should return validation error for invalid request", () => {
    const mockReq = {
      body: {
        name: "J", // Too short
        email: "invalid-email",
        password: "123",
        role: "invalid-role",
      },
      params: {},
      query: {},
      cookies: {},
    } as Request;

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const mockNext = jest.fn() as NextFunction;

    const middleware = validateWithZod(registerSchema);
    middleware(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: {
        message: "Validation failed",
        details: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
            code: expect.any(String),
          }),
        ]),
      },
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
