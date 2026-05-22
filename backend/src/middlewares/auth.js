const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const AppError = require("../utils/AppError");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Unauthorized", 401);
  }

  const token = authHeader.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Token expired", 401);
    }
    if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
      throw new AppError("Invalid token", 401);
    }
    throw err;
  }

  const user = await User.findById(decoded.id).select("-password").lean();
  if (!user) throw new AppError("User not found", 401);

  req.user = user;
  next();
});

module.exports = { protect };
