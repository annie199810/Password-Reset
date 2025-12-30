console.log("✅ auth.js loaded");

const express = require("express");
const jwt = require("jsonwebtoken");
const { sendResetEmail } = require("../utils/mailer");
const router = express.Router();

// dummy DB (replace with real DB later)
const users = [
  { email: "test@example.com", id: 1 }
];

// 🔐 REQUEST RESET LINK
router.post("/request-reset", async (req, res) => {
  const { email } = req.body;
  console.log("📩 Reset request received for:", email);

  const user = users.find(u => u.email === email);

  // Always send same response (security)
  if (!user) {
    console.log("⚠️ Email not found, still returning OK");
    return res.json({
      ok: true,
      message: "If the email exists, a reset link has been sent"
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailSent = await sendResetEmail(user.email, resetLink);

  if (!mailSent) {
    console.log("❌ Mail sending failed internally");
  }

  res.json({
    ok: true,
    message: "If the email exists, a reset link has been sent"
  });
});

module.exports = router;
