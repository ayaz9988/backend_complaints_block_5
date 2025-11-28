"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = errorHandler;
const config_1 = __importDefault(require("../config"));
const utils_1 = require("../utils");
const CustomError_1 = __importDefault(require("../errors/CustomError"));
function errorHandler(
  error,
  req,
  res,
  // eslint-disable-next-line prettier/prettier
  next,
) {
  if (res.headersSent || config_1.default.debug) {
    next(error);
    return;
  }
  if (error instanceof CustomError_1.default) {
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
      },
    });
  }
  res.status(500).json({
    error: {
      message:
        (0, utils_1.getErrorMessage)(error) ||
        "An error occurred. Please view logs for more details.",
    },
  });
}
