console.log("✅ auth.js loaded");

const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const router = express.Router();


let transporter;

(async () => {
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
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
    return res.status(400).json({ error: "Email required" });
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
      from: '"Password Reset App" <no-reply@test.com>',
      to: email,
      subject: "Password Reset",
      html: `
        <p>Password reset requested.</p>
        <a href="${resetLink}">Reset Password</a>
        <p>Link expires in 15 minutes</p>
      `
    });

    console.log("📧 Mail sent");
    console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info));

    res.json({
      ok: true,
      message: "Reset link sent to email"
    });

  } catch (err) {
    console.error("❌ Mail error:", err);
    res.status(500).json({ error: "Email failed" });
  }
});


router.post("/reset-password", async (req, res) => {
  const { token, email, password } = req.body;

  if (!token || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.email !== email) {
      return res.status(400).json({ error: "Invalid token" });
    }

    res.json({
      ok: true,
      message: "Password reset successful"
    });

  } catch (err) {
    res.status(400).json({ error: "Token expired or invalid" });
  }
});

module.exports = router;
