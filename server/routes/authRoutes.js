const express = require("express");

const {
  getMe,
  login,
  register,
  verifyEmail,
  resendVerificationEmail,
  updatePassword,
  updateProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const { protect } = require("../middleware/auth");

const {
  forgotPasswordLimiter,
  resetPasswordLimiter,
  resendVerificationLimiter,
} = require("../middleware/rateLimit");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.get("/verify-email/:token", verifyEmail);

router.post("/resend-verification", resendVerificationLimiter, resendVerificationEmail);

router.post(
  "/forgot-password",
  forgotPasswordLimiter,
  forgotPassword,
);

router.post(
  "/reset-password",
  resetPasswordLimiter,
  resetPassword,
);

router.get("/me", protect, getMe);

router.put("/profile", protect, updateProfile);

router.put("/password", protect, updatePassword);

module.exports = router;