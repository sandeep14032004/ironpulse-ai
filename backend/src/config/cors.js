const cors = require("cors");

const parseOrigins = (...values) =>
  values
    .flatMap((value) => (value || "").split(","))
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

const allowedOrigins = [...new Set(parseOrigins(process.env.FRONTEND_DEV_URL, process.env.FRONTEND_URL))];
const allowedPreviewOriginPatterns = [
  /^https:\/\/ironpulse(?:-ai)?(?:-[a-z0-9]+)*-sandeep-patis-projects\.vercel\.app$/i,
];

const isAllowedOrigin = (origin) =>
  allowedOrigins.includes(origin) || allowedPreviewOriginPatterns.some((pattern) => pattern.test(origin));

const corsOptions = {
  origin(origin, callback) {
    const normalizedOrigin = origin?.replace(/\/+$/, "");

    if (!normalizedOrigin || isAllowedOrigin(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS policy blocked this origin"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

module.exports = cors(corsOptions);
