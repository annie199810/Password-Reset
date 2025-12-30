console.log("✅ auth.js loaded");

const express = require("express");
const jwt = require("jsonwebtoken");
const { sendResetEmail } = require("../utils/mailer");

const router = express.Router();

/**
 * 🔐 REQUEST PASSWORD RESET
 * POST /api/auth/request-reset
 */
router.post("/request-reset", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("📩 Reset request received for:", email);

    if (!email) {
      console.log("❌ Email missing in request");
      return res.status(400).json({ error: "Email is required" });
    }

    // 🔑 Generate reset token (valid for 1 hour)
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 🔗 Build reset link (frontend)
    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password` +
      `?token=${token}&email=${encodeURIComponent(email)}`;

    console.log("🔗 Reset link generated:", resetLink);

    // 📧 Send reset email
    const sent = await sendResetEmail(email, resetLink);

    if (sent) {
      console.log("✅ Reset email sent successfully to:", email);
    } else {
      console.log("❌ sendResetEmail returned false");
    }

    // 🔒 Always return same response (security best practice)
    return res.json({
      ok: true,
      message: "If the email exists, a reset link has been sent"
    });

  } catch (err) {
    console.error("🔥 Error in request-reset:", err);
    return res.status(500).json({
      error: "Server error while processing reset request"
    });
  }
});

/**
 * 🔁 RESET PASSWORD
 * POST /api/auth/reset-password
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, email, password } = req.body;
    console.log("🔁 Reset password attempt for:", email);

    if (!token || !email || !password) {
      console.log("❌ Missing fields in reset-password");
      return res.status(400).json({
        error: "Token, email and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters"
      });
    }

    // 🔍 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.email !== email) {
      console.log("❌ Token email mismatch");
      return res.status(400).json({
        error: "Invalid or expired reset link"
      });
    }

    // ⚠️ NO DATABASE HERE (GUVI TASK)
    // In real apps, update password in DB here
    console.log("✅ Token verified. Password can be updated.");

    return res.json({
      ok: true,
      message: "Password reset successful"
    });

  } catch (err) {
    console.error("🔥 Error in reset-password:", err);
    return res.status(400).json({
      error: "Invalid or expired reset link"
    });
  }
});

module.exports = router;
