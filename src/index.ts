import http from "http";
import config from "./config";
import { createServer } from "./server";
import prisma from "./prisma";
import logger from "./lib/logger";

const app = createServer();
const server = http.createServer(app);

const gracefulShutdown = async (signal: string) => {
  logger.info(
    { signal },
    "Shutdown signal received. Shutting down gracefully...",
  );
  server.close(async () => {
    logger.info("HTTP server closed.");
    await prisma.$disconnect();
    logger.info("Database connection closed.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

server.listen(config.port, "0.0.0.0", () => {
  logger.info({ port: config.port, env: config.env }, "API server started");
});
