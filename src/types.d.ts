//src/types.d.ts
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken"; // Assuming you're using jsonwebtoken's standard payload

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // Use the specific type of your JWT payload
    }
  }
}
