const requiredVars = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "NODE_ENV",
  "FRONTEND_URL",
  "FRONTEND_DEV_URL",
];

const loadEnv = () => {
  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
};

module.exports = { loadEnv };
