const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const corsMiddleware = require("./config/cors");
const swaggerSpec = require("./config/swagger");
const routes = require("./routes");
const requestLogger = require("./middlewares/requestLogger");
const { notFound, errorHandler } = require("./middlewares/errorHandler");
const { buildSuccess } = require("./utils/response");

const app = express();

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(requestLogger);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (req, res) => {
  res.json(buildSuccess({ message: "Service healthy", data: { uptime: process.uptime() } }));
});
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
