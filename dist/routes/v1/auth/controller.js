"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.login = exports.register = void 0;
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
    sameSite: isProd ? "none" : "lax",
    domain: isProd ? COOKIE_DOMAIN : undefined,
    maxAge,
  });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: isProd ? COOKIE_DOMAIN : undefined,
  });
}
const register = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ error: "Missing fields" });
  const allowed = ["admin", "Director", "head_of_neighborhood"];
  if (!allowed.includes(role))
    return res.status(400).json({ error: "Invalid role" });
  const passwordHash = await (0, auth_1.hashPassword)(password);
  const user = await prisma_1.default.user.create({
    data: { email, passwordHash, role },
  });
  res.json({ id: user.id, email: user.email, role: user.role });
};
exports.register = register;
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing credentials" });
  const user = await prisma_1.default.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await (0, auth_1.verifyPassword)(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const accessToken = (0, jwt_1.signAccessToken)(
    { sub: user.id, role: user.role, email: user.email },
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
    user: { id: user.id, email: user.email, role: user.role },
  });
};
exports.login = login;
const refresh = async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "No refresh token" });
  const rt = await (0, auth_1.findValidRefreshToken)(token);
  if (!rt) return res.status(401).json({ error: "Invalid refresh token" });
  try {
    const payload = (0, jwt_1.verifyToken)(token, REFRESH_SECRET);
    // @ts-expect-error payload of unknown type
    const user = await prisma_1.default.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) return res.status(401).json({ error: "Invalid" });
    await (0, auth_1.revokeRefreshToken)(token);
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
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
};
exports.refresh = refresh;
const logout = async (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    await (0, auth_1.revokeRefreshToken)(token);
    clearRefreshCookie(res);
  }
  res.json({ ok: true });
};
exports.logout = logout;
