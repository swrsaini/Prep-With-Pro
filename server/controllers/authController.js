const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

function toPublicUser(user) {
  const userObject = user.toObject ? user.toObject() : { ...user };

  delete userObject.password;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpires;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  delete userObject.passwordChangedAt;

  return userObject;
}

function createToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   REGISTER
========================= */

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "An account with that email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate secure email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Store only the hashed token in database
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,

      emailVerified: false,

      emailVerificationToken: hashedVerificationToken,

      // Token expires after 15 minutes
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });

    // Verification URL contains the ORIGINAL token
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    const safeName = escapeHtml(user.name || "there");

    await sendEmail({
      to: user.email,
      subject: "Verify Your Prep With Pro Email",
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          line-height: 1.6;
        ">

          <h2>Verify Your Email</h2>

          <p>Hi ${safeName},</p>

          <p>
            Welcome to <strong>Prep With Pro</strong>!
          </p>

          <p>
            Please verify your email address to activate your account.
          </p>

          <p>
            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background: #000;
                color: #fff;
                text-decoration: none;
                border-radius: 6px;
              "
            >
              Verify Email
            </a>
          </p>

          <p>
            This verification link will expire in 15 minutes.
          </p>

          <p>
            If you did not create a Prep With Pro account,
            you can safely ignore this email.
          </p>

          <p>
            Thanks,<br>
            Prep With Pro
          </p>

        </div>
      `,
    });

    return res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.code === 11000) {
      return res
        .status(400)
        .json({ message: "An account with that email already exists." });
    }

    return res.status(500).json({
      message: "Unable to register account.",
    });
  }
}

/* =========================
   VERIFY EMAIL
========================= */

async function verifyEmail(req, res) {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required.",
      });
    }

    // Hash token received from frontend
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find matching non-expired token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link.",
      });
    }

    // Mark email as verified
    user.emailVerified = true;

    // Remove verification token
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    return res.json({
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error("Verify email error:", error);

    return res.status(500).json({
      message: "Unable to verify email.",
    });
  }
}

/* =========================
   RESEND VERIFICATION EMAIL
========================= */

async function resendVerificationEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Don't reveal whether account exists
    if (!user) {
      return res.json({
        message:
          "If an unverified account with that email exists, a verification email has been sent.",
      });
    }

    // Already verified
    if (user.emailVerified) {
      return res.status(400).json({
        message: "This email is already verified.",
      });
    }

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    user.emailVerificationToken = hashedVerificationToken;
    user.emailVerificationExpires = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    await user.save();

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

    const safeName = escapeHtml(user.name || "there");

    await sendEmail({
      to: user.email,
      subject: "Verify Your Prep With Pro Email",
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          line-height: 1.6;
        ">

          <h2>Verify Your Email</h2>

          <p>Hi ${safeName},</p>

          <p>
            Here is your new email verification link.
          </p>

          <p>
            <a
              href="${verificationUrl}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background: #000;
                color: #fff;
                text-decoration: none;
                border-radius: 6px;
              "
            >
              Verify Email
            </a>
          </p>

          <p>
            This link will expire in 15 minutes.
          </p>

          <p>
            Thanks,<br>
            Prep With Pro
          </p>

        </div>
      `,
    });

    return res.json({
      message:
        "If an unverified account with that email exists, a verification email has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    return res.status(500).json({
      message: "Unable to resend verification email.",
    });
  }
}

/* =========================
   LOGIN
========================= */

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    const passwordMatches =
      user && (await bcrypt.compare(password, user.password));

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Require email verification before login
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email address before logging in.",
        emailVerificationRequired: true,
      });
    }

    return res.json({
      token: createToken(user),
      user: toPublicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to log in.",
    });
  }
}

/* =========================
   GET ME
========================= */

async function getMe(req, res) {
  if (!req.user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }

  return res.json({
    user: toPublicUser(req.user),
  });
}

/* =========================
   UPDATE PROFILE
========================= */

async function updateProfile(req, res) {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      message: "Name is required.",
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name: name.trim() } },
    { new: true, runValidators: true },
  );

  if (!user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }

  return res.json({
    user: toPublicUser(user),
  });
}

/* =========================
   UPDATE PASSWORD
========================= */

async function updatePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Current and new passwords are required.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      message: "New password must be at least 6 characters.",
    });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      message: "User not found.",
    });
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!passwordMatches) {
    return res.status(401).json({
      message: "Current password is incorrect.",
    });
  }

  user.password = await bcrypt.hash(newPassword, 12);

  user.passwordChangedAt = new Date(
    Math.floor(Date.now() / 1000) * 1000,
  );

  await user.save();

  return res.json({
    message: "Password updated successfully.",
  });
}

/* =========================
   FORGOT PASSWORD
========================= */

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Don't reveal whether an account exists
    if (!user) {
      return res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.passwordResetToken = hashedResetToken;
    user.passwordResetExpires = new Date(
      Date.now() + 15 * 60 * 1000,
    );

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const safeName = escapeHtml(user.name || "there");

    await sendEmail({
      to: user.email,
      subject: "Reset Your Prep With Pro Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">

          <h2>Reset Your Password</h2>

          <p>Hi ${safeName},</p>

          <p>
            We received a request to reset your Prep With Pro password.
          </p>

          <p>
            Click the button below to create a new password:
          </p>

          <p>
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 20px;
                background: #000;
                color: #fff;
                text-decoration: none;
                border-radius: 6px;
              "
            >
              Reset Password
            </a>
          </p>

          <p>
            This link will expire in 15 minutes.
          </p>

          <p>
            If you didn't request a password reset, you can safely ignore
            this email.
          </p>

          <p>
            Thanks,<br>
            Prep With Pro
          </p>

        </div>
      `,
    });

    return res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Unable to process password reset request.",
    });
  }
}

/* =========================
   RESET PASSWORD
========================= */

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters.",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset token.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    user.passwordChangedAt = new Date(
      Math.floor(Date.now() / 1000) * 1000,
    );

    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    return res.json({
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Unable to reset password.",
    });
  }
}

module.exports = {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
};