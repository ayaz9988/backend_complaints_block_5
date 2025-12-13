"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashRefreshToken = hashRefreshToken;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.makeExpiryDate = makeExpiryDate;
exports.createRefreshToken = createRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.findValidRefreshToken = findValidRefreshToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const date_fns_1 = require("date-fns");
const prisma_1 = __importDefault(require("../prisma"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SALT_ROUNDS = 12;
async function hashRefreshToken(token) {
  return bcryptjs_1.default.hash(token, SALT_ROUNDS);
}
async function hashPassword(password) {
  return bcryptjs_1.default.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcryptjs_1.default.compare(password, hash);
}
function makeExpiryDate(days) {
  return (0, date_fns_1.add)(new Date(), { days });
}
// export async function createRefreshToken(
//   userId: string,
//   token: string,
//   expiresAt: Date,
// ) {
//   const decoded = jwt.decode(token) as { jti: string };
//   const tokenHash = await hashRefreshToken(token);
//   return prisma.refreshToken.create({
//     data: {
//       userId,
//       token: tokenHash,
//       expiresAt,
//       revoked: false,
//       jti: decoded.jti,
//     },
//   });
// }
async function createRefreshToken(userId, token, expiresAt) {
  const decoded = jsonwebtoken_1.default.decode(token);
  if (!decoded || !decoded.jti) {
    throw new Error("Invalid token: No jti claim found");
  }
  const tokenHash = await hashRefreshToken(token);
  return prisma_1.default.refreshToken.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
      revoked: false,
      jti: decoded.jti,
    },
  });
}
async function revokeRefreshToken(userId, token) {
  const decoded = jsonwebtoken_1.default.decode(token);
  return prisma_1.default.refreshToken.updateMany({
    where: { userId, jti: decoded.jti },
    data: { revoked: true },
  });
}
async function findValidRefreshToken(userId, token) {
  const decoded = jsonwebtoken_1.default.decode(token);
  const storedToken = await prisma_1.default.refreshToken.findFirst({
    where: {
      userId,
      jti: decoded.jti,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });
  if (!storedToken) return null;
  const matches = await bcryptjs_1.default.compare(token, storedToken.token);
  return matches ? storedToken : null;
}
