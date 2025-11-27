// auth/index.ts

import express, { Router } from "express";
import requireRoles from "../../../middleware/requireRoles";
// If you have a generic authentication middleware, you can import it here.
// Example: import requireAuth from "../../../middleware/requireAuth";
import { register, login, refresh, logout, getCurrentUser } from "./controller";

const auth: Router = express.Router();

auth.post("/register", requireRoles(["manager"]), register);

// Login
auth.post("/login", login);

// Refresh
auth.post("/refresh", refresh);

// Logout
auth.post("/logout", logout);

// Current user
auth.get(
  "/current",
  requireRoles(["manager", "admin", "mukhtar"]),
  getCurrentUser,
);

export default auth;
