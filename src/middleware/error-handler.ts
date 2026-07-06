import { NextFunction, Request, Response } from "express";
import config from "../config";
import { getErrorMessage } from "../utils";
import CustomError from "../errors/CustomError";
import logger from "../lib/logger";

export default function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent || config.debug) {
    next(error);
    return;
  }

  if (error instanceof CustomError) {
    logger.warn(
      { err: error, path: req.path, method: req.method },
      error.message,
    );
    res.status(error.statusCode).json({
      error: {
        message: error.message,
        code: error.code,
      },
    });
    return;
  }

  logger.error(
    { err: error, path: req.path, method: req.method },
    "Unhandled error",
  );
  res.status(500).json({
    error: {
      message: config.debug
        ? getErrorMessage(error)
        : "An error occurred. Please view logs for more details.",
    },
  });
}
