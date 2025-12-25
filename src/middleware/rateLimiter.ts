import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

/**
 * Rate limiter for anonymous users only
 * - 1 request per hour
 * - 5 requests per day
 */
export const anonymousRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1, // 1 request per hour
  skip: (req: Request) => {
    // Skip rate limiting if user is authenticated
    const header = req.headers.authorization;
    const token = header?.split(" ")[1];

    // Skip rate limiting during tests
    if (process.env.NODE_ENV === "test") {
      return true;
    }

    return !!token; // Skip if token exists (authenticated user)
  },
  message: {
    error: "Too many requests from this IP, please try again after 1 hour.",
    retryAfter: 3600, // seconds
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Daily rate limiter for anonymous users only
 * - 5 requests per day
 */
export const anonymousDailyRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 requests per day
  skip: (req: Request) => {
    // Skip rate limiting if user is authenticated
    const header = req.headers.authorization;
    const token = header?.split(" ")[1];

    // Skip rate limiting during tests
    if (process.env.NODE_ENV === "test") {
      return true;
    }

    return !!token; // Skip if token exists (authenticated user)
  },
  message: {
    error: "Too many requests from this IP today, please try again tomorrow.",
    retryAfter: 86400, // seconds (24 hours)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Slow down middleware for anonymous users only
 * Adds delay to subsequent requests from the same IP
 */
export const anonymousSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 1, // allow 1 request to go at full speed
  delayMs: () => 500, // add 500ms delay per request after delayAfter
  skip: (req: Request) => {
    // Skip slow down if user is authenticated
    const header = req.headers.authorization;
    const token = header?.split(" ")[1];

    // Skip rate limiting during tests
    if (process.env.NODE_ENV === "test") {
      return true;
    }

    return !!token; // Skip if token exists (authenticated user)
  },
});

/**
 * Combined rate limiting middleware for anonymous users
 * Applies both hourly and daily limits
 */
export const anonymousCombinedRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Check if user is authenticated
  const header = req.headers.authorization;
  const token = header?.split(" ")[1];

  if (token) {
    // User is authenticated, skip all rate limiting
    return next();
  }

  // For anonymous users, apply both limits
  // We'll use the hourly limiter first, then daily
  anonymousRateLimiter(req, res, (err) => {
    if (err) {
      return next(err);
    }

    // If hourly limit passed, check daily limit
    anonymousDailyRateLimiter(req, res, (err) => {
      if (err) {
        return next(err);
      }

      // If both limits passed, apply slow down
      anonymousSlowDown(req, res, next);
    });
  });
};
