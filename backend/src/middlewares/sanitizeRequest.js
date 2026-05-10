const mongoSanitize = require("express-mongo-sanitize");

const sanitizeObject = (value) => {
  if (!value || typeof value !== "object") {
    return value;
  }

  return mongoSanitize.sanitize(value);
};

const sanitizeRequest = (req, res, next) => {
  ["body", "params", "headers"].forEach((key) => {
    sanitizeObject(req[key]);
  });

  // Express 5 exposes req.query as a getter-only property, so we sanitize
  // a cloned object and then shadow it on the request instance.
  const sanitizedQuery = sanitizeObject({ ...(req.query || {}) });

  Object.defineProperty(req, "query", {
    configurable: true,
    enumerable: true,
    writable: true,
    value: sanitizedQuery,
  });

  next();
};

module.exports = sanitizeRequest;
