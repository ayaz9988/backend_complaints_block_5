import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { Priority } from "@prisma/client";

// Common validation schemas
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .transform((email: string) => email.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be no more than 128 characters")
  .transform((password: string) => password.trim());

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be no more than 100 characters")
  .transform((name: string) => name.trim());

export const roleSchema = z.enum(["manager", "admin", "mukhtar"], {
  errorMap: () => ({
    message: "Invalid role. Must be one of: manager, admin, mukhtar",
  }),
});

export const statusSchema = z.enum(["pending", "accepted", "refused"], {
  errorMap: () => ({
    message: "Invalid status. Must be one of: pending, accepted, refused",
  }),
});

export const prioritySchema = z.enum(["high", "mid", "low"], {
  errorMap: () => ({
    message: "Invalid priority. Must be one of: high, mid, low",
  }),
});

export const contentStatusSchema = z.enum(["active", "inactive"], {
  errorMap: () => ({
    message: "Invalid content status. Must be one of: active, inactive",
  }),
});

export const initiativeStatusSchema = z.enum(
  ["pending", "approved", "rejected"],
  {
    errorMap: () => ({
      message:
        "Invalid initiative status. Must be one of: pending, approved, rejected",
    }),
  },
);

export const uuidSchema = z
  .string()
  .uuid("Invalid UUID format")
  .transform((uuid: string) => uuid.toLowerCase().trim());

export const bigintSchema = z
  .union([z.string(), z.number()])
  .transform((value: string | number) => {
    try {
      return BigInt(value);
    } catch {
      throw new Error("Invalid BigInt format");
    }
  });

export const phoneNumberSchema = z
  .string()
  .min(7, "Phone number must be at least 7 digits")
  .max(20, "Phone number must be no more than 20 characters")
  .regex(/^[+\d\s-()]+$/, "Invalid phone number format")
  .transform((phone: string) => phone.replace(/[^\d+\s-()]/g, "").trim());

export const neighborhoodSchema = z
  .string()
  .min(2, "Neighborhood name must be at least 2 characters")
  .max(100, "Neighborhood name must be no more than 100 characters")
  .transform((neighborhood: string) => neighborhood.trim());

export const complaintTypeSchema = z
  .string()
  .min(2, "Complaint type must be at least 2 characters")
  .max(50, "Complaint type must be no more than 50 characters")
  .transform((type: string) => type.trim());

export const trackingTagSchema = z
  .string()
  .min(1, "Tracking tag is required")
  .transform((tag: string) => tag.trim().toLowerCase());

export const solutionInfoSchema = z
  .string()
  .min(10, "Solution info must be at least 10 characters")
  .max(1000, "Solution info must be no more than 1000 characters")
  .transform((info: string) => info.trim());

export const refusalReasonSchema = z
  .string()
  .min(10, "Refusal reason must be at least 10 characters")
  .max(1000, "Refusal reason must be no more than 1000 characters")
  .transform((reason: string) => reason.trim());

export const locationSchema = z
  .string()
  .min(2, "Location must be at least 2 characters")
  .max(200, "Location must be no more than 200 characters")
  .transform((location: string) => location.trim());

export const descriptionSchema = z
  .string()
  .min(10, "Description must be at least 10 characters")
  .max(2000, "Description must be no more than 2000 characters")
  .transform((description: string) => description.trim());

export const titleSchema = z
  .string()
  .min(2, "Title must be at least 2 characters")
  .max(200, "Title must be no more than 200 characters")
  .transform((title: string) => title.trim());

export const contentSchema = z
  .string()
  .min(10, "Content must be at least 10 characters")
  .max(5000, "Content must be no more than 5000 characters")
  .transform((content: string) => content.trim());

export const urlSchema = z
  .string()
  .url("Invalid URL format")
  .refine(
    (url: string) => url.startsWith("http://") || url.startsWith("https://"),
    {
      message: "URL must start with http:// or https://",
    },
  )
  .transform((url: string) => url.trim());

// Request validation schemas

// Auth schemas
export const registerSchema = z.object({
  body: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: roleSchema,
    neighborhood: z
      .string()
      .optional()
      .transform((n: string | undefined) => n?.trim() || null),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

export const solutionInfoSchemaForAccept = z.object({
  body: z.object({
    solutionInfo: solutionInfoSchema,
  }),
});

export const refusalReasonSchemaForRefuse = z.object({
  body: z.object({
    refusalReason: refusalReasonSchema,
  }),
});

// Complaint schemas
export const createComplaintSchema = z.object({
  body: z.object({
    submitterName: nameSchema.optional(),
    contactNumber: phoneNumberSchema,
    description: descriptionSchema,
    location: locationSchema.optional(),
    neighborhood: neighborhoodSchema,
    complaint_type: complaintTypeSchema,
    suggestedSolution: z
      .string()
      .optional()
      .transform((s: string | undefined) => s?.trim() || null),
  }),
});

export const updateComplaintSchema = z.object({
  params: z.object({
    id: bigintSchema,
  }),
  body: z.object({
    priority: prioritySchema.optional(),
    notes: z
      .string()
      .optional()
      .transform((n: string | undefined) => n?.trim() || null),
    estimatedReviewTime: z
      .string()
      .optional()
      .transform((t: string | undefined) => t?.trim() || null),
  }),
});

export const complaintIdSchema = z.object({
  params: z.object({
    id: bigintSchema,
  }),
});

export const announcementIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const achievementIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const initiativeIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const approveInitiativeSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const rejectInitiativeSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    rejectionReason: refusalReasonSchema,
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const trackingTagSchemaForTrack = z.object({
  params: z.object({
    trackingTag: trackingTagSchema,
  }),
});

// User schemas
export const getUserByIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
    neighborhood: neighborhoodSchema.optional(),
  }),
});

export const deactivateUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Announcement schemas
export const createAnnouncementSchema = z.object({
  body: z.object({
    title: titleSchema,
    content: contentSchema,
    status: contentStatusSchema.optional(),
  }),
});

export const updateAnnouncementSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    title: titleSchema.optional(),
    content: contentSchema.optional(),
    status: contentStatusSchema.optional(),
  }),
});

// Achievement schemas
export const createAchievementSchema = z.object({
  body: z.object({
    title: titleSchema,
    description: contentSchema,
    status: contentStatusSchema.optional(),
  }),
});

export const updateAchievementSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    title: titleSchema.optional(),
    description: contentSchema.optional(),
    status: contentStatusSchema.optional(),
  }),
});

// Initiative schemas
export const createInitiativeSchema = z.object({
  body: z.object({
    title: titleSchema,
    description: contentSchema,
    submitterName: nameSchema.optional(),
    contactNumber: phoneNumberSchema.optional(),
    location: locationSchema.optional(),
    neighborhood: neighborhoodSchema.optional(),
  }),
});

export const updateInitiativeSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    title: titleSchema.optional(),
    description: contentSchema.optional(),
    status: initiativeStatusSchema.optional(),
    submitterName: nameSchema.optional(),
    contactNumber: phoneNumberSchema.optional(),
    location: locationSchema.optional(),
    neighborhood: neighborhoodSchema.optional(),
  }),
});

// Query schemas
export const getUsersByRoleSchema = z.object({
  query: z
    .object({
      role: z.enum(["admin", "mukhtar", "manager"]).optional(),
    })
    .optional(),
});

export const getUserComplaintsSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Middleware for Zod validation
export function validateWithZod(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request based on the schema
      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
        cookies: req.cookies,
      });

      // Merge validated data back into req
      if (validatedData.body) {
        req.body = validatedData.body;
      }
      if (validatedData.params) {
        req.params = validatedData.params;
      }
      if (validatedData.query) {
        req.query = validatedData.query;
      }
      if (validatedData.cookies) {
        req.cookies = validatedData.cookies;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            message: "Validation failed",
            details: (error as z.ZodError).errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
              code: err.code,
            })),
          },
        });
      }
      next(error);
    }
  };
}

// Type exports for use in controllers
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type CreateComplaintData = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintData = z.infer<typeof updateComplaintSchema>;
export type CreateAnnouncementData = z.infer<typeof createAnnouncementSchema>;
export type CreateAchievementData = z.infer<typeof createAchievementSchema>;
export type CreateInitiativeData = z.infer<typeof createInitiativeSchema>;
