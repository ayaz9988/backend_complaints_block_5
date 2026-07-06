// import { PrismaClient } from "@prisma/client";

// const prisma = new PrismaClient();
// export default prisma;

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import config from "./config";

const connectionString = `${process.env.DATABASE_URL}`;

const poolConfig = {
  connectionString,
  min: config.dbPoolMin,
  max: config.dbPoolMax,
};
const adapter = new PrismaPg(poolConfig);

const prisma = new PrismaClient({
  adapter,
  log:
    config.env === "development"
      ? ["query", "warn", "error"]
      : ["warn", "error"],
});

export default prisma;
