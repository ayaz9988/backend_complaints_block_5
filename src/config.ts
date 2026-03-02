const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000"),
  debug: process.env.APP_DEBUG === "true",
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  ACCESS_EXPIRES: process.env.ACCESS_EXPIRES || "15m",
  REFRESH_DAYS: Number(process.env.REFRESH_EXPIRES_DAYS || 30),
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || "localhost",
  COOKIE_NAME: "refresh_token",
  isProd: process.env.NODE_ENV === "production",
  // File upload configuration
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  maxImageSize: 5 * 1024 * 1024, // 5MB for images
  maxVideoSize: 10 * 1024 * 1024, // 10MB for videos
};

export default config;
