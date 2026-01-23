console.log("✅ auth.js loaded");

const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const router = express.Router();



let transporter;

(async () => {
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  console.log("✅ Ethereal email ready");
})();



router.post("/request-reset", async (req, res) => {
  console.log("🔹 STEP 1: /request-reset hit");

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "Email is required"
    });
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
    const info = await transporter.sendMail({
      from: '"Password Reset App" <no-reply@password-reset.com>',
      to: email,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 15 minutes.</p>
      `
    });

    console.log("📧 Email sent");
    console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info));

    return res.json({
      ok: true,
      message: "If the email exists, a reset link has been sent."
    });

  } catch (err) {
    console.error("❌ Mail error:", err);
    return res.status(500).json({
      error: "Failed to send reset email"
    });
  }
});



router.post("/reset-password", async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return res.status(400).json({
      error: "Token, email and password are required"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.email !== email) {
      return res.status(400).json({
        error: "Invalid or expired reset link"
      });
    }

   

    return res.json({
      ok: true,
      message: "Password reset successful"
    });

  } catch (err) {
    return res.status(400).json({
      error: "Invalid or expired reset link"
    });
  }
});



router.get("/request-reset", (req, res) => {
  res.json({
    ok: true,
    message: "Use POST to request password reset"
  });
});

router.get("/reset-password", (req, res) => {
  res.json({
    ok: true,
    message: "Password reset handled via POST"
  });
});

module.exports = router;
