"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const requireRoles_1 = __importDefault(require("../../../middleware/requireRoles"));
const controller_1 = require("./controller");
const auth = express_1.default.Router();
// Register (admin only)
auth.post("/register", (0, requireRoles_1.default)(["admin"]), controller_1.register);
// Login
auth.post("/login", controller_1.login);
// Refresh
auth.post("/refresh", controller_1.refresh);
// Logout
auth.post("/logout", controller_1.logout);
exports.default = auth;
