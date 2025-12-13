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
const achievements = express_1.default.Router();
// Public routes
achievements.get("/", controller_1.listAchievements);
achievements.get("/:id", controller_1.getAchievement);
// Manager and Admin only routes
achievements.post(
  "/",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.createAchievement,
);
achievements.patch(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.updateAchievement,
);
achievements.delete(
  "/:id",
  (0, requireRoles_1.default)(["manager", "admin"]),
  controller_1.deleteAchievement,
);
exports.default = achievements;
