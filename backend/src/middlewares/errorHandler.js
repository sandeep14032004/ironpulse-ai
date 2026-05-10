const AppError = require("../utils/AppError");
const { buildError } = require("../utils/response");
const logger = require("../utils/logger");

const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  logger.error({ message, statusCode, path: req.originalUrl, method: req.method, stack: err.stack });

  const response = buildError({
    message,
    errors: process.env.NODE_ENV === "production" && statusCode === 500 ? [] : (err.errors || []),
  });

  if (process.env.NODE_ENV !== "production" && err.stack) {
    response.meta = { stack: err.stack };
  }

  res.status(statusCode).json(response);
};

module.exports = { notFound, errorHandler };
