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
const announcements = express_1.default.Router();
// Public routes
announcements.get("/", controller_1.listAnnouncements);
announcements.get("/:id", controller_1.getAnnouncement);
// Manager and Admin only routes
announcements.post(
  "/",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.createAnnouncement,
);
announcements.patch(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.updateAnnouncement,
);
announcements.delete(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.deleteAnnouncement,
);
exports.default = announcements;
