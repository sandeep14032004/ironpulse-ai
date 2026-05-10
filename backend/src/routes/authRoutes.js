const express = require("express");
const { protect } = require("../middlewares/auth");
const {
  registerValidation,
  loginValidation,
  register,
  login,
  refresh,
  logout,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/profile", protect, getProfile);
router.patch("/profile", protect, updateProfile);

module.exports = router;
