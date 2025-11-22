/**
 * TEST HELPER FUNCTIONS
 *
 * These are reusable functions that make writing tests easier
 * Think of them as your testing toolbox!
 */

import { Express } from "express";
import request from "supertest";
import prisma from "../prisma";
import { hashPassword } from "../services/auth";

/**
 * Create a test user in the database
 *
 * This is useful when you need a user to already exist before running a test
 * For example: testing login requires a user to exist first
 */
export async function createTestUser(
  email = "test@example.com",
  password = "password123",
  role: "admin" | "Director" | "head_of_neighborhood" = "admin",
) {
  const passwordHash = await hashPassword(password);

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
    },
  });
}

/**
 * Register a new user via the API
 *
 * This simulates what would happen when a real user registers
 * Returns the response so you can check if it worked
 */
export async function registerUser(
  app: Express,
  email: string,
  password: string,
  role: string,
  accessToken?: string,
) {
  const req = request(app).post("/v1/auth/register").send({
    email,
    password,
    role,
  });

  // If an access token is provided, add it to the Authorization header
  // (registration requires admin authentication)
  if (accessToken) {
    req.set("Authorization", `Bearer ${accessToken}`);
  }

  return req;
}

/**
 * Login a user via the API
 *
 * This simulates a real login flow
 * Returns the response which includes the access token and cookies
 */
export async function loginUser(app: Express, email: string, password: string) {
  return request(app).post("/v1/auth/login").send({
    email,
    password,
  });
}

/**
 * Extract the refresh token from a cookie string or array
 *
 * Supertest returns cookies as strings like "refresh_token=abc123; Path=/; HttpOnly"
 * This helper extracts just the token value
 */
export function extractRefreshToken(
  setCookieHeader: string | string[] | undefined,
): string | null {
  if (!setCookieHeader) return null;

  // Convert to array if it's a single string
  const cookies = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];

  // Find the refresh_token cookie
  const refreshCookie = cookies.find((cookie) =>
    cookie.startsWith("refresh_token="),
  );

  if (!refreshCookie) return null;

  // Extract the token value (everything between "refresh_token=" and the first ";")
  const match = refreshCookie.match(/refresh_token=([^;]+)/);
  return match ? match[1] : null;
}
