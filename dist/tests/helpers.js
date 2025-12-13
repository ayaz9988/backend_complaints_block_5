"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestUser = createTestUser;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.extractRefreshToken = extractRefreshToken;
const supertest_1 = __importDefault(require("supertest"));
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../services/auth");
/**
 * Create a test user directly in the database.
 * Allows setting is_active status and neighborhood for testing.
 */
async function createTestUser(
  email = "test@example.com",
  password = "password123",
  role = "admin",
  isActive = true,
  name = "Test User",
  neighborhood,
) {
  const passwordHash = await (0, auth_1.hashPassword)(password);
  return prisma_1.default.user.create({
    data: {
      email,
      passwordHash,
      role,
      is_active: isActive,
      name,
      neighborhood, // NEW: Include neighborhood in data
    },
  });
}
/**
 * Register a new user via the API.
 * Allows setting a neighborhood for mukhtar registration.
 */
async function registerUser(
  app,
  email,
  password,
  role,
  name,
  accessToken,
  neighborhood,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestBody = {
    email,
    password,
    role,
    name,
  };
  // Only add neighborhood to the body if it's provided
  if (neighborhood) {
    requestBody.neighborhood = neighborhood;
  }
  const req = (0, supertest_1.default)(app)
    .post("/v1/auth/register")
    .send(requestBody);
  if (accessToken) {
    req.set("Authorization", `Bearer ${accessToken}`);
  }
  return req;
}
/**
 * Login a user via the API
 */
async function loginUser(app, email, password) {
  return (0, supertest_1.default)(app).post("/v1/auth/login").send({
    email,
    password,
  });
}
/**
 * Extract the refresh token from a cookie string or array
 */
function extractRefreshToken(setCookieHeader) {
  if (!setCookieHeader) return null;
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  const refreshCookie = cookies.find((cookie) =>
    cookie.startsWith("refresh_token="),
  );
  if (!refreshCookie) return null;
  const match = refreshCookie.match(/refresh_token=([^;]+)/);
  return match ? match[1] : null;
}
