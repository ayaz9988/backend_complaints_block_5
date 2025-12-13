"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requireRoles;
const jwt_1 = require("../lib/jwt");
const config_1 = __importDefault(require("../config"));
function requireRoles(allowedRoles) {
  return (req, res, next) => {
    try {
      const header = req.headers.authorization;
      const token = header?.split(" ")[1];
      if (!token) return res.status(401).json({ error: "Missing token" });
      const secret = config_1.default.ACCESS_SECRET;
      const payload = (0, jwt_1.verifyToken)(token, secret);
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
// import jwt, { JwtPayload } from 'jsonwebtoken';
// import { Request, Response, NextFunction } from 'express';
// import config from '../config';
// const requireRoles = (allowedRoles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     // Add this log to see the path and method
//     console.log(`[requireRoles] Middleware hit for: ${req.method} ${req.path}`);
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];
//     if (token == null) {
//       console.log("[requireRoles] No token found.");
//       return res.sendStatus(401);
//     }
//     // Add this log to see the token it received
//     console.log("[requireRoles] Token received:", token);
//     jwt.verify(token, config.ACCESS_SECRET as jwt.Secret, (err, user) => {
//       if (err) {
//         // Add this log to see the verification error
//         console.log("[requireRoles] JWT verification failed:", err.message);
//         return res.sendStatus(401);
//       }
//       // Add this log to see the decoded user payload
//       console.log("[requireRoles] JWT verified. User payload:", user);
//       req.user = user as JwtPayload; // Assuming you attach the user payload here
//       if (!allowedRoles.includes(req.user.role)) {
//         console.log(`[requireRoles] User role '${req.user.role}' not in allowed roles [${allowedRoles.join(', ')}]`);
//         return res.sendStatus(403); // Forbidden
//       }
//       console.log("[requireRoles] Authentication and Authorization successful. Calling next().");
//       next();
//     });
//   };
// };
// export default requireRoles;
