"use strict";
// auth/index.ts
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const requireRoles_1 = __importDefault(
  require("../../../middleware/requireRoles"),
);
// If you have a generic authentication middleware, you can import it here.
// Example: import requireAuth from "../../../middleware/requireAuth";
const controller_1 = require("./controller");
const auth = express_1.default.Router();
auth.post(
  "/register",
  (0, requireRoles_1.default)(["manager"]),
  controller_1.register,
);
// Login
auth.post("/login", controller_1.login);
// Refresh
auth.post("/refresh", controller_1.refresh);
// Logout
auth.post("/logout", controller_1.logout);
// Current user
auth.get(
  "/current",
  (0, requireRoles_1.default)(["manager", "admin", "mukhtar"]),
  controller_1.getCurrentUser,
);
exports.default = auth;
