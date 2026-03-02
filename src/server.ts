import express, { Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import config from "./config";
import v1 from "./routes/v1";
import errorHandler from "./middleware/error-handler";
import cookieParser from "cookie-parser";
import path from "path";

export const createServer = () => {
  const FRONTEND_ORIGIN =
    process.env.FRONTEND_ORIGIN || "http://localhost:3000";
  const app = express();

  // Serve uploaded files statically
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), config.uploadDir)),
  );

  app
    .disable("x-powered-by")
    .use(morgan("dev"))
    .use(express.urlencoded({ extended: true }))
    .use(express.json())
    // .use(cors())
    .use(cors({ origin: FRONTEND_ORIGIN, credentials: true }))
    .use(cookieParser());

  app.get("/health", (req: Request, res: Response) => {
    res.json({ ok: true, environment: config.env });
  });

  app.use("/v1", v1);

  app.use(errorHandler);

  return app;
};
