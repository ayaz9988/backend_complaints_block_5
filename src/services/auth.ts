import bcrypt from "bcryptjs";
import { add, isAfter } from "date-fns";
import prisma from "../prisma";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 12;

export async function hashRefreshToken(token: string) {
  return bcrypt.hash(token, SALT_ROUNDS);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function makeExpiryDate(days: number) {
  return add(new Date(), { days });
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

export async function createRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date,
) {
  const decoded = jwt.decode(token) as { jti?: string } | null;
  if (!decoded || !decoded.jti) {
    throw new Error("Invalid token: No jti claim found");
  }
  const tokenHash = await hashRefreshToken(token);
  return prisma.refreshToken.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
      revoked: false,
      jti: decoded.jti,
    },
  });
}

export async function revokeRefreshToken(userId: string, token: string) {
  const decoded = jwt.decode(token) as { jti: string };
  return prisma.refreshToken.updateMany({
    where: { userId, jti: decoded.jti },
    data: { revoked: true },
  });
}

export async function findValidRefreshToken(userId: string, token: string) {
  const decoded = jwt.decode(token) as { jti: string };
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      userId,
      jti: decoded.jti,
      revoked: false,
      expiresAt: { gt: new Date() },
    },
  });
  if (!storedToken) return null;
  const matches = await bcrypt.compare(token, storedToken.token);
  return matches ? storedToken : null;
}
