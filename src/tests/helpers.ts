import { Express } from "express";
import request from "supertest";
import prisma from "../prisma";
import { hashPassword } from "../services/auth";

export type UserRole = "manager" | "admin" | "mukhtar";

/**
 * Create a test user directly in the database.
 * Allows setting is_active status and neighborhood for testing.
 */
export async function createTestUser(
  email = "test@example.com",
  password = "password123",
  role: UserRole = "admin",
  isActive = true,
  name = "Test User",
  neighborhood?: string, // NEW: Optional neighborhood parameter
) {
  const passwordHash = await hashPassword(password);

  return prisma.user.create({
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
export async function registerUser(
  app: Express,
  email: string,
  password: string,
  role: string,
  name: string,
  accessToken?: string,
  neighborhood?: string, // NEW: Optional neighborhood parameter
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const requestBody: any = {
    email,
    password,
    role,
    name,
  };

  // Only add neighborhood to the body if it's provided
  if (neighborhood) {
    requestBody.neighborhood = neighborhood;
  }

  const req = request(app).post("/v1/auth/register").send(requestBody);

  if (accessToken) {
    req.set("Authorization", `Bearer ${accessToken}`);
  }

  return req;
}

/**
 * Login a user via the API
 */
export async function loginUser(app: Express, email: string, password: string) {
  return request(app).post("/v1/auth/login").send({
    email,
    password,
  });
}

/**
 * Extract the refresh token from a cookie string or array
 */
export function extractRefreshToken(
  setCookieHeader: string | string[] | undefined,
): string | null {
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
