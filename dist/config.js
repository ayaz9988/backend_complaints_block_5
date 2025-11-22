"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "3000"),
    debug: process.env.APP_DEBUG === "true",
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    ACCESS_EXPIRES: process.env.ACCESS_EXPIRES || "15m",
    REFRESH_DAYS: Number(process.env.REFRESH_EXPIRES_DAYS || 30),
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "localhost",
    COOKIE_NAME: "refresh_token",
    isProd: process.env.NODE_ENV === "production",
};
exports.default = config;
