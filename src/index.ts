import config from "./config";
import { createServer } from "./server";

const server = createServer();

server.listen(config.port, "0.0.0.0",() => {
  console.log(`api running on ${config.port}`);
});
