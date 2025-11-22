import express, { Router } from "express";
import requireRoles from "../../../middleware/requireRoles";
import { register, login, refresh, logout } from "./controller";

const auth: Router = express.Router();

// Register (admin only)
auth.post("/register", requireRoles(["admin"]), register);

// Login
auth.post("/login", login);

// Refresh
auth.post("/refresh", refresh);

// Logout
auth.post("/logout", logout);

export default auth;
