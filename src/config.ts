const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000"),
  debug: process.env.APP_DEBUG === "true",
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  ACCESS_EXPIRES: process.env.ACCESS_EXPIRES || "15m",
  REFRESH_DAYS: Number(process.env.REFRESH_EXPIRES_DAYS || 30),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "localhost",
  COOKIE_NAME: "refresh_token",
  isProd: process.env.NODE_ENV === "production",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxImageSize: 5 * 1024 * 1024,
  maxVideoSize: 10 * 1024 * 1024,
  dbPoolMin: parseInt(process.env.DB_POOL_MIN || "2"),
  dbPoolMax: parseInt(process.env.DB_POOL_MAX || "20"),
};

export default config;
