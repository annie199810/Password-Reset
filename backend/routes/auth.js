console.log("✅ auth.js loaded");

const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Name, email and password are required"
    });
  }

  res.json({
    ok: true,
    message: "User registered successfully (demo)"
  });
});


router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required"
    });
  }

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    ok: true,
    message: "Login successful",
    token
  });
});


router.post("/request-reset", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password` +
      `?token=${token}&email=${encodeURIComponent(email)}`;

    res.json({
      ok: true,
      message: "If the email exists, a reset link has been sent",
      demoResetLink: resetLink
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


router.post("/reset-password", async (req, res) => {
  try {
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.email !== email) {
      return res.status(400).json({
        error: "Invalid or expired reset link"
      });
    }

    res.json({
      ok: true,
      message: "Password reset successful"
    });

  } catch (err) {
    res.status(400).json({
      error: "Invalid or expired reset link"
    });
  }
});

module.exports = router;
