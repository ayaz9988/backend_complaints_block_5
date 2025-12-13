"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const requireRoles_1 = __importDefault(
  require("../../../middleware/requireRoles"),
);
const initiatives = express_1.default.Router();
// Public endpoint for creating initiatives
initiatives.post("/", controller_1.createInitiative);
// Protected endpoints for manager and admin
initiatives.get(
  "/",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.listInitiatives,
);
initiatives.get(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.getInitiative,
);
initiatives.patch(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.updateInitiative,
);
initiatives.delete(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.deleteInitiative,
);
exports.default = initiatives;
