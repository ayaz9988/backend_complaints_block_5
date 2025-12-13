"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const complaints_1 = __importDefault(require("./complaints"));
const announcements_1 = __importDefault(require("./announcements"));
const achievements_1 = __importDefault(require("./achievements"));
const users_1 = __importDefault(require("./users"));
const initiatives_1 = __importDefault(require("./initiatives"));
const v1 = express_1.default.Router();
v1.use("/auth", auth_1.default);
v1.use("/complaints", complaints_1.default);
v1.use("/announcements", announcements_1.default);
v1.use("/achievements", achievements_1.default);
v1.use("/users", users_1.default);
v1.use("/initiatives", initiatives_1.default);
exports.default = v1;
