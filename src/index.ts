import config from "./config";
import { createServer } from "./server";

const server = createServer();

server.listen(config.port, () => {
  console.log(`api running on ${config.port}`);
});
