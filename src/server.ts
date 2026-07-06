import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import config from "./config";
import v1 from "./routes/v1";
import errorHandler from "./middleware/error-handler";
import cookieParser from "cookie-parser";
import path from "path";
import logger from "./lib/logger";

export const createServer = () => {
  const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  const app = express();

  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), config.uploadDir)),
  );

  app
    .disable("x-powered-by")
    .use(helmet())
    .use(pinoHttp({ logger }))
    .use(express.urlencoded({ extended: true }))
    .use(express.json())
    .use(cors({ origin: FRONTEND_ORIGIN, credentials: true }))
    .use(cookieParser());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, environment: config.env });
  });

  app.use("/v1", v1);

  app.use(errorHandler);

  return app;
};
