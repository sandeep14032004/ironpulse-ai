require("dotenv").config();
const app = require("./app");
const { connectDb } = require("./config/db");
const { loadEnv } = require("./config/env");
const logger = require("./utils/logger");
const { registerRealtimeBridge } = require("./services/realtimeEventBridge");

const port = process.env.PORT || 5000;

process.on("uncaughtException", (error) => {
  logger.error({ message: "Uncaught exception", stack: error.stack });
  process.exit(1);
});

const bootstrap = async () => {
  loadEnv();
  await connectDb();
  registerRealtimeBridge();

  const server = app.listen(port, () => {
    logger.info(`IronPulse AI backend running on port ${port}`);
  });

  process.on("unhandledRejection", (error) => {
    logger.error({ message: "Unhandled rejection", stack: error.stack });
    server.close(() => process.exit(1));
  });
};

bootstrap().catch((error) => {
  logger.error({ message: "Failed to bootstrap server", stack: error.stack });
  process.exit(1);
});
