"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.makeExpiryDate = makeExpiryDate;
exports.createRefreshToken = createRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.findValidRefreshToken = findValidRefreshToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const date_fns_1 = require("date-fns");
const prisma_1 = __importDefault(require("../prisma"));
const SALT_ROUNDS = 12;
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
function makeExpiryDate(days) {
    return (0, date_fns_1.add)(new Date(), { days });
}
async function createRefreshToken(userId, token, expiresAt) {
    return prisma_1.default.refreshToken.create({
        data: { userId, token, expiresAt },
    });
}
async function revokeRefreshToken(token) {
    return prisma_1.default.refreshToken.updateMany({
        where: { token, revoked: false },
        data: { revoked: true },
    });
}
async function findValidRefreshToken(token) {
    const rt = await prisma_1.default.refreshToken.findUnique({ where: { token } });
    if (!rt || rt.revoked)
        return null;
    if ((0, date_fns_1.isAfter)(new Date(), rt.expiresAt))
        return null;
    return rt;
}
