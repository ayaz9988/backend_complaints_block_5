// auth/index.ts

import express, { Router } from "express";
import requireRoles from "../../../middleware/requireRoles";
import { validateWithZod } from "../../../validation";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../../../validation";
import { anonymousCombinedRateLimiter } from "../../../middleware/rateLimiter";
// If you have a generic authentication middleware, you can import it here.
// Example: import requireAuth from "../../../middleware/requireAuth";
import { register, login, refresh, logout, getCurrentUser } from "./controller";

const auth: Router = express.Router();

auth.post(
  "/register",
  requireRoles(["manager"]),
  validateWithZod(registerSchema),
  register,
);

// Login - Apply rate limiting for anonymous users
auth.post(
  "/login",
  anonymousCombinedRateLimiter,
  validateWithZod(loginSchema),
  login,
);

// Refresh
auth.post("/refresh", validateWithZod(refreshTokenSchema), refresh);

// Logout
auth.post("/logout", logout);

// Current user
auth.get(
  "/current",
  requireRoles(["manager", "admin", "mukhtar"]),
  getCurrentUser,
);

export default auth;
