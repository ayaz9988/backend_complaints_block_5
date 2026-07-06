import pino from "pino";
import config from "../config";

const logger = pino({
  level: config.logLevel,
  transport: config.env === "development" ? { target: "pino-pretty" } : undefined,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "body.password", "body.passwordHash"],
    censor: "[REDACTED]",
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

export default logger;
