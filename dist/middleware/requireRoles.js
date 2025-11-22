"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requireRoles;
const jwt_1 = require("../lib/jwt");
function requireRoles(allowedRoles) {
    return (req, res, next) => {
        try {
            const header = req.headers.authorization;
            const token = header?.split(" ")[1];
            if (!token)
                return res.status(401).json({ error: "Missing token" });
            const secret = process.env.JWT_ACCESS_SECRET;
            const payload = (0, jwt_1.verifyToken)(token, secret);
            //@ts-expect-error payload of type unknown
            if (!allowedRoles.includes(payload.role))
                return res.status(403).json({ error: "Forbidden" });
            req.user = payload;
            next();
        }
        catch {
            return res.status(401).json({ error: "Invalid token" });
        }
    };
}
