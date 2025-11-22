import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";
import type jwt from "jsonwebtoken";

export default function requireRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      const token = header?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Missing token" });
      const secret = process.env.JWT_ACCESS_SECRET as jwt.Secret;
      const payload = verifyToken(token, secret);
      //@ts-expect-error payload of type unknown
      if (!allowedRoles.includes(payload.role))
        return res.status(403).json({ error: "Forbidden" });
      req.user = payload;
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}
