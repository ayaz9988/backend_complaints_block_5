# Validation System Documentation

This project now includes a comprehensive validation system built with Zod, providing robust input validation and sanitization for all API endpoints.

## Overview

The validation system provides:

- **Centralized validation schemas** using Zod
- **Automatic input sanitization** (trimming, case normalization, etc.)
- **Type-safe validation** with TypeScript integration
- **Comprehensive error messages** for invalid inputs
- **Middleware integration** for easy use in Express routes
- **Reusable validation schemas** for common data types

## Related Documentation

- [API Documentation](DOCUMENTATION.md) - See how validation integrates with API endpoints
- [Database Indexing Strategy](INDEXING_STRATEGY.md) - How validation supports database optimization
- [README](README.md) - Project setup and configuration

## Architecture

### Core Files

- `src/validation/index.ts` - Main validation utilities and schemas
- `src/tests/validation.test.ts` - Comprehensive test suite

### Validation Schemas

The system includes pre-built schemas for common data types:

#### Common Schemas

- `emailSchema` - Validates and sanitizes email addresses
- `passwordSchema` - Validates password strength
- `nameSchema` - Validates and sanitizes names
- `roleSchema` - Validates user roles (manager, admin, mukhtar)
- `statusSchema` - Validates complaint/status values
- `prioritySchema` - Validates priority levels (high, mid, low)
- `uuidSchema` - Validates UUID format
- `bigintSchema` - Validates BigInt values
- `phoneNumberSchema` - Validates phone numbers
- `neighborhoodSchema` - Validates neighborhood names
- `complaintTypeSchema` - Validates complaint types
- `trackingTagSchema` - Validates tracking tags
- `solutionInfoSchema` - Validates solution information
- `refusalReasonSchema` - Validates refusal reasons
- `locationSchema` - Validates location data
- `descriptionSchema` - Validates descriptions
- `titleSchema` - Validates titles
- `contentSchema` - Validates content fields
- `urlSchema` - Validates URLs

#### Request Schemas

- `registerSchema` - User registration validation
- `loginSchema` - User login validation
- `refreshTokenSchema` - Token refresh validation
- `createComplaintSchema` - Complaint creation validation
- `updateComplaintSchema` - Complaint update validation
- `createAnnouncementSchema` - Announcement creation validation
- `createAchievementSchema` - Achievement creation validation
- `createInitiativeSchema` - Initiative creation validation
- And many more...

## Usage

### Basic Validation

```typescript
import { emailSchema, validateWithZod } from "./validation";

// Validate a single field
const result = emailSchema.safeParse("user@example.com");
if (result.success) {
  console.log("Valid email:", result.data);
} else {
  console.log("Validation errors:", result.error.errors);
}
```

### Route Validation

```typescript
import { Router } from "express";
import { validateWithZod, registerSchema } from "./validation";

const router = Router();

// Apply validation middleware to route
router.post("/register", validateWithZod(registerSchema), (req, res) => {
  // req.body is now validated and sanitized
  const { name, email, password, role } = req.body;
  // ... handle request
});
```

### Custom Validation

```typescript
import { z } from "zod";

// Create custom schema
const customSchema = z.object({
  username: z.string().min(3).max(50),
  age: z.number().min(18).max(100),
});

// Use with middleware
router.post("/custom", validateWithZod(customSchema), handler);
```

## Features

### Input Sanitization

All schemas automatically sanitize input:

- **Trim whitespace** from strings
- **Convert emails to lowercase**
- **Remove invalid characters** from phone numbers
- **Normalize UUIDs** to lowercase
- **Validate and clean URLs**

### Error Handling

The validation middleware provides detailed error responses:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "invalid_string"
      },
      {
        "field": "password",
        "message": "Password must be at least 6 characters",
        "code": "too_small"
      }
    ]
  }
}
```

### Type Safety

All schemas provide TypeScript types:

```typescript
import type { RegisterData } from "./validation";

// Type-safe access to validated data
function handleRegistration(data: RegisterData) {
  const { name, email, password, role } = data.body;
  // TypeScript knows the exact types
}
```

## Integration with Existing Code

### Controllers

Controllers can now rely on validated and sanitized data:

```typescript
// Before: Manual validation in controller
export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }
  // ... more validation
};

// After: Validation handled by middleware
export const register = async (req: Request, res: Response) => {
  // req.body is already validated and sanitized
  const { name, email, password, role } = req.body;
  // ... business logic only
};
```

### Routes

Routes are cleaner and more declarative:

```typescript
// Before: Validation mixed with routing
auth.post("/register", requireRoles(["manager"]), register);

// After: Validation as middleware
auth.post(
  "/register",
  requireRoles(["manager"]),
  validateWithZod(registerSchema),
  register,
);
```

## Testing

The validation system includes comprehensive tests:

```bash
# Run validation tests
pnpm test src/tests/validation.test.ts

# Run all tests
pnpm test
```

Test coverage includes:

- Valid input validation
- Invalid input rejection
- Input sanitization
- Error message accuracy
- Middleware functionality

## Best Practices

### 1. Use Pre-built Schemas

Always use existing schemas when possible:

```typescript
// Good: Use existing schema
const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Avoid: Re-creating validation logic
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
```

### 2. Add Custom Validation

For business-specific rules, extend existing schemas:

```typescript
const customEmailSchema = emailSchema.refine(
  (email) => email.endsWith("@company.com"),
  { message: "Must use company email" },
);
```

### 3. Handle Validation Errors

The middleware automatically handles validation errors, but you can customize error responses:

```typescript
// Custom error handler
app.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: {
        message: "Custom validation error message",
        details: error.errors,
      },
    });
  }
  next(error);
});
```

### 4. Type Safety

Always use TypeScript types for validated data:

```typescript
import type { z } from "zod";
import { createComplaintSchema } from "./validation";

type ComplaintData = z.infer<typeof createComplaintSchema>;

export const createComplaint = async (req: Request, res: Response) => {
  const data: ComplaintData = req.body;
  // TypeScript ensures type safety
};
```

## Migration Guide

To migrate existing endpoints to use the new validation system:

1. **Import validation schemas** in your route files
2. **Add validation middleware** to your routes
3. **Remove manual validation** from controllers
4. **Update TypeScript types** to use validated data types
5. **Test thoroughly** to ensure validation works correctly

### Example Migration

```typescript
// Before migration
// routes/v1/auth/index.ts
auth.post("/register", requireRoles(["manager"]), register);

// controllers/auth.ts
export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  // ... rest of logic
};

// After migration
// routes/v1/auth/index.ts
auth.post(
  "/register",
  requireRoles(["manager"]),
  validateWithZod(registerSchema),
  register,
);

// controllers/auth.ts
export const register = async (req: Request, res: Response) => {
  // req.body is already validated and sanitized
  const { name, email, password, role } = req.body;
  // ... business logic only
};
```

## Performance

The validation system is optimized for performance:

- **Schema compilation** happens once at startup
- **Validation is fast** and efficient
- **Memory usage** is minimal
- **No runtime overhead** for valid requests

## Security

The validation system enhances security:

- **Input sanitization** prevents XSS and injection attacks
- **Type validation** prevents type confusion
- **Length limits** prevent DoS attacks
- **Format validation** ensures data integrity

## Future Enhancements

Potential future improvements:

1. **Custom error messages** per field
2. **Internationalization** support for error messages
3. **Schema versioning** for API evolution
4. **Performance monitoring** and metrics
5. **Schema documentation** generation

## Support

For questions or issues with the validation system:

1. Check the test files for usage examples
2. Review the schema definitions in `src/validation/index.ts`
3. Consult the Zod documentation: <https://zod.dev/>
4. Ask the development team for assistance

## Integration with System Components

The validation system works closely with:

- **API Endpoints** ([DOCUMENTATION.md](DOCUMENTATION.md)) - Provides input validation for all API routes
- **Rate Limiting** - Works alongside rate limiting to provide comprehensive API protection
- **Database Schema** ([Prisma Schema](prisma/schema.prisma)) - Ensures data integrity before database operations
- **Database Indexing** ([INDEXING_STRATEGY.md](INDEXING_STRATEGY.md)) - Clean, validated data supports efficient indexing
