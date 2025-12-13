"use strict";
// auth/controller.ts
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser =
  exports.logout =
  exports.refresh =
  exports.login =
  exports.register =
    void 0;
exports.setRefreshCookie = setRefreshCookie;
exports.clearRefreshCookie = clearRefreshCookie;
const config_1 = __importDefault(require("../../../config"));
const jwt_1 = require("../../../lib/jwt");
const prisma_1 = __importDefault(require("../../../prisma"));
const auth_1 = require("../../../services/auth");
const ACCESS_SECRET = config_1.default.ACCESS_SECRET;
const REFRESH_SECRET = config_1.default.REFRESH_SECRET;
const ACCESS_EXPIRES = config_1.default.ACCESS_EXPIRES;
const REFRESH_DAYS = config_1.default.REFRESH_DAYS;
const COOKIE_DOMAIN = config_1.default.COOKIE_DOMAIN;
const COOKIE_NAME = config_1.default.COOKIE_NAME;
const isProd = config_1.default.isProd;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setRefreshCookie(res, token, days = REFRESH_DAYS) {
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
function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    domain: isProd ? COOKIE_DOMAIN : undefined,
  });
}
const allowedRoles = ["manager", "admin", "mukhtar"];
const register = async (req, res) => {
  try {
    const { name, email, password, role, neighborhood } = req.body;
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: "Missing fields" });
    if (!allowedRoles.includes(role))
      return res.status(400).json({ error: "Invalid role" });
    if (role === "mukhtar" && !neighborhood) {
      return res
        .status(400)
        .json({ error: "Neighborhood is required for mukhtar role" });
    }
    const userNeighborhood = role === "mukhtar" ? neighborhood : null;
    const passwordHash = await (0, auth_1.hashPassword)(password);
    const user = await prisma_1.default.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        is_active: true,
        neighborhood: userNeighborhood,
      },
    });
    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      neighborhood: user.neighborhood,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.register = register;
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing credentials" });
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user || !user.is_active)
      return res
        .status(401)
        .json({ error: "Invalid credentials or inactive user" });
    const ok = await (0, auth_1.verifyPassword)(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const accessToken = (0, jwt_1.signAccessToken)(
      { sub: user.id, name: user.name, role: user.role, email: user.email },
      ACCESS_SECRET,
      ACCESS_EXPIRES,
    );
    const refreshToken = (0, jwt_1.signRefreshToken)(
      { sub: user.id },
      REFRESH_SECRET,
      `${REFRESH_DAYS}d`,
    );
    const expiresAt = (0, auth_1.makeExpiryDate)(REFRESH_DAYS);
    await (0, auth_1.createRefreshToken)(user.id, refreshToken, expiresAt);
    setRefreshCookie(res, refreshToken);
    res.json({
      accessToken,
      expiresIn: ACCESS_EXPIRES,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        neighborhood: user.neighborhood,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.login = login;
const refresh = async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "No refresh token" });
  try {
    const payload = (0, jwt_1.verifyToken)(token, REFRESH_SECRET);
    // @ts-expect-error payload of unknown type
    const userId = payload.sub;
    const rt = await (0, auth_1.findValidRefreshToken)(userId, token);
    if (!rt) return res.status(401).json({ error: "Invalid refresh token" });
    const user = await prisma_1.default.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.is_active)
      return res.status(401).json({ error: "Invalid or inactive user" });
    await (0, auth_1.revokeRefreshToken)(user.id, token);
    const newRefresh = (0, jwt_1.signRefreshToken)(
      { sub: user.id },
      REFRESH_SECRET,
      `${REFRESH_DAYS}d`,
    );
    await (0, auth_1.createRefreshToken)(
      user.id,
      newRefresh,
      (0, auth_1.makeExpiryDate)(REFRESH_DAYS),
    );
    setRefreshCookie(res, newRefresh);
    const accessToken = (0, jwt_1.signAccessToken)(
      { sub: user.id, role: user.role, email: user.email },
      ACCESS_SECRET,
      ACCESS_EXPIRES,
    );
    res.json({
      accessToken,
      expiresIn: ACCESS_EXPIRES,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        neighborhood: user.neighborhood,
      },
    });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};
exports.refresh = refresh;
const logout = async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    try {
      const payload = (0, jwt_1.verifyToken)(token, REFRESH_SECRET);
      // @ts-expect-error payload of unknown type
      const userId = payload.sub;
      await (0, auth_1.revokeRefreshToken)(userId, token);
    } catch (error) {
      /* empty */
    } finally {
      clearRefreshCookie(res);
    }
  }
  return res.status(200).json({ ok: true });
};
exports.logout = logout;
// Get the current authenticated user's information
const getCurrentUser = async (req, res) => {
  try {
    if (!req.user || !req.user.sub) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const userId = req.user.sub;
    const user = await prisma_1.default.user.findUnique({
      where: { id: userId },
      // Select only the fields you want to return to the client
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        neighborhood: true,
        is_active: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
exports.getCurrentUser = getCurrentUser;
