import config from "../../../config";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../../../lib/jwt";
import prisma from "../../../prisma";
import {
  createRefreshToken,
  findValidRefreshToken,
  hashPassword,
  makeExpiryDate,
  revokeRefreshToken,
  verifyPassword,
} from "../../../services/auth";
import { Request, Response } from "express";

const ACCESS_SECRET = config.ACCESS_SECRET;
const REFRESH_SECRET = config.REFRESH_SECRET;
const ACCESS_EXPIRES = config.ACCESS_EXPIRES;
const REFRESH_DAYS = config.REFRESH_DAYS;
const COOKIE_DOMAIN = config.COOKIE_DOMAIN;
const COOKIE_NAME = config.COOKIE_NAME;
const isProd = config.isProd;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setRefreshCookie(res: any, token: string, days = REFRESH_DAYS) {
  const maxAge = days * 24 * 60 * 60 * 1000;
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd, // true in production
    sameSite: "lax",
    domain: isProd ? COOKIE_DOMAIN : undefined,
    maxAge,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clearRefreshCookie(res: any) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    domain: isProd ? COOKIE_DOMAIN : undefined,
  });
}

const allowedRoles = ["manager", "admin", "mukhtar"];

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role)
      return res.status(400).json({ error: "Missing fields" });

    if (!allowedRoles.includes(role))
      return res.status(400).json({ error: "Invalid role" });

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, passwordHash, role, is_active: true },
    });
    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.is_active)
      return res
        .status(401)
        .json({ error: "Invalid credentials or inactive user" });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = signAccessToken(
      { sub: user.id, role: user.role, email: user.email },
      ACCESS_SECRET,
      ACCESS_EXPIRES,
    );
    const refreshToken = signRefreshToken(
      { sub: user.id },
      REFRESH_SECRET,
      `${REFRESH_DAYS}d`,
    );
    const expiresAt = makeExpiryDate(REFRESH_DAYS);
    await createRefreshToken(user.id, refreshToken, expiresAt);
    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      expiresIn: ACCESS_EXPIRES,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const payload = verifyToken(token, REFRESH_SECRET);
    // @ts-expect-error payload of unknown type
    const userId = payload.sub as string;

    const rt = await findValidRefreshToken(userId, token);
    if (!rt) return res.status(401).json({ error: "Invalid refresh token" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.is_active)
      return res.status(401).json({ error: "Invalid or inactive user" });

    await revokeRefreshToken(user.id, token);

    const newRefresh = signRefreshToken(
      { sub: user.id },
      REFRESH_SECRET,
      `${REFRESH_DAYS}d`,
    );
    await createRefreshToken(user.id, newRefresh, makeExpiryDate(REFRESH_DAYS));
    setRefreshCookie(res, newRefresh);

    const accessToken = signAccessToken(
      { sub: user.id, role: user.role, email: user.email },
      ACCESS_SECRET,
      ACCESS_EXPIRES,
    );
    res.json({
      accessToken,
      expiresIn: ACCESS_EXPIRES,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyToken(token, REFRESH_SECRET);
      // @ts-expect-error payload of unknown type
      const userId = payload.sub as string;
      await revokeRefreshToken(userId, token);
    } catch (error) {
      /* empty */
    } finally {
      clearRefreshCookie(res);
    }
  }
  return res.status(200).json({ ok: true });
};
