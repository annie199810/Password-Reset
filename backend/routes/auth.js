console.log("✅ auth.js loaded");

const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const router = express.Router();


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS  
  }
});


router.post("/request-reset", async (req, res) => {
  console.log("🔹 STEP 1: /request-reset hit");

  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const resetLink =
    `${process.env.FRONTEND_URL}/reset-password` +
    `?token=${token}&email=${encodeURIComponent(email)}`;

  try {
    await transporter.sendMail({
      from: `"Password Reset App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset.</p>
        <p>Click below:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 15 minutes.</p>
      `
    });

    console.log("📧 Email sent to:", email);

    return res.json({
      ok: true,
      message: "If the email exists, a reset link has been sent."
    });

  } catch (err) {
    console.error("❌ Mail error:", err);
    return res.status(500).json({ error: "Failed to send reset email" });
  }
});


router.post("/reset-password", async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return res.status(400).json({
      error: "Token, email and password are required"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.email !== email) {
      return res.status(400).json({ error: "Invalid reset link" });
    }

    return res.json({
      ok: true,
      message: "Password reset successful"
    });

  } catch {
    return res.status(400).json({
      error: "Reset link expired or invalid"
    });
  }
});

module.exports = router;
