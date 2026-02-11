console.log("✅ auth.js loaded");

const express = require("express");
const jwt = require("jsonwebtoken");
const { sendResetEmail } = require("../utils/mailer");

const router = express.Router();


router.post("/request-reset", async (req, res) => {
  console.log("🔹 STEP 1: /request-reset hit");

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
   
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password` +
      `?token=${token}&email=${encodeURIComponent(email)}`;

   
    const sent = await sendResetEmail(email, resetLink);

    if (!sent) {
      console.error("❌ Failed to send reset email");
      return res.status(500).json({ error: "Failed to send reset email" });
    }

    console.log("📧 Reset email sent to:", email);

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

  } catch (err) {
    return res.status(400).json({
      error: "Reset link expired or invalid"
    });
  }
});

module.exports = router;
