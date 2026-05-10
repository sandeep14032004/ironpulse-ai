const { body } = require("express-validator");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const asyncHandler = require("../middlewares/asyncHandler");
const AppError = require("../utils/AppError");
const { signAccessToken, signRefreshToken } = require("../utils/jwt");
const validate = require("../middlewares/validate");
const { hashToken } = require("../utils/token");
const { buildSuccess } = require("../utils/response");

const registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
  validate,
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

const createAuthPayload = async (userId) => {
  const accessToken = signAccessToken({ id: userId });
  const refreshToken = signRefreshToken({ id: userId });
  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

const register = asyncHandler(async (req, res) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) throw new AppError("Email already in use", 409);

  const user = await User.create(req.body);
  const tokens = await createAuthPayload(user._id);
  setRefreshCookie(res, tokens.refreshToken);
  res.status(201).json(buildSuccess({
    message: "Registered successfully",
    data: {
      user: { ...user.toObject(), password: undefined },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  }));
});

const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select("+password");
  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError("Invalid credentials", 401);
  }
  const tokens = await createAuthPayload(user._id);
  setRefreshCookie(res, tokens.refreshToken);
  res.json(buildSuccess({
    message: "Login successful",
    data: {
      user: { ...user.toObject(), password: undefined },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  }));
});

const refresh = asyncHandler(async (req, res) => {
  const incomingToken = req.body.refreshToken || req.cookies.refreshToken;
  if (!incomingToken) throw new AppError("Refresh token is required", 401);

  const tokenHash = hashToken(incomingToken);
  const stored = await RefreshToken.findOne({ tokenHash, revokedAt: null });
  if (!stored) throw new AppError("Invalid refresh token", 401);
  if (stored.expiresAt < new Date()) throw new AppError("Refresh token expired", 401);

  const user = await User.findById(stored.user);
  if (!user) throw new AppError("User not found", 404);

  const accessToken = signAccessToken({ id: user._id });
  const nextRefreshToken = signRefreshToken({ id: user._id });
  const nextTokenHash = hashToken(nextRefreshToken);

  stored.revokedAt = new Date();
  stored.replacedByTokenHash = nextTokenHash;
  await stored.save();

  await RefreshToken.create({
    user: user._id,
    tokenHash: nextTokenHash,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  setRefreshCookie(res, nextRefreshToken);
  res.json(buildSuccess({ message: "Token refreshed", data: { accessToken, refreshToken: nextRefreshToken } }));
});

const logout = asyncHandler(async (req, res) => {
  const incomingToken = req.body.refreshToken || req.cookies.refreshToken;
  if (incomingToken) {
    const tokenHash = hashToken(incomingToken);
    await RefreshToken.findOneAndUpdate({ tokenHash, revokedAt: null }, { revokedAt: new Date() });
  }
  res.clearCookie("refreshToken");
  res.json(buildSuccess({ message: "Logged out successfully", data: {} }));
});

const getProfile = asyncHandler(async (req, res) => {
  res.json(buildSuccess({ message: "Profile fetched", data: { user: req.user } }));
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "age", "height", "weight", "targetWeight", "fitnessGoal", "themePreference", "timerDuration", "notificationsEnabled", "preferredUnits"];
  const updates = {};
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select("-password");
  res.json(buildSuccess({ message: "Profile updated", data: { user } }));
});

module.exports = {
  registerValidation,
  loginValidation,
  register,
  login,
  refresh,
  logout,
  getProfile,
  updateProfile,
};
