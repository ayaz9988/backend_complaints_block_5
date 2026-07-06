import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config";

export interface AuthenticatedJwtPayload extends JwtPayload {
  sub: string;
  role: string;
  name?: string;
  email?: string;
}

export default function requireRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      const token = header?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Missing token" });

      const payload = verifyToken<AuthenticatedJwtPayload>(token, config.ACCESS_SECRET as string);

      if (!allowedRoles.includes(payload.role))
        return res.status(403).json({ error: "Forbidden" });

      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}
