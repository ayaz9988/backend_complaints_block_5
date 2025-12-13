"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = require("crypto");
function signAccessToken(payload, secret, expiresIn = "15m") {
  return jsonwebtoken_1.default.sign(payload, secret, { expiresIn });
}
function signRefreshToken(payload, secret, expiresIn) {
  return jsonwebtoken_1.default.sign(
    { ...payload, jti: (0, crypto_1.randomUUID)() },
    secret,
    {
      expiresIn,
    },
  );
}
function verifyToken(token, secret) {
  return jsonwebtoken_1.default.verify(token, secret);
}
