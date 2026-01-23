console.log("✅ auth.js loaded");

const express = require("express");
const jwt = require("jsonwebtoken");
const sgMail = require("@sendgrid/mail");

const router = express.Router();


sgMail.setApiKey(process.env.SENDGRID_API_KEY);


router.get("/register", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Register endpoint is working. Use POST to create account."
  });
});


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
  console.log("🔹 STEP 1: /request-reset hit");

  const { email } = req.body;
  console.log("🔹 STEP 2: Email from frontend:", email);

  if (!email) {
    console.log("❌ STEP 2 FAILED: Email missing");
    return res.status(400).json({
      error: "Email is required"
    });
  }

  console.log("🔹 STEP 3: ENV check");
  console.log("   JWT_SECRET exists:", !!process.env.JWT_SECRET);
  console.log("   SENDGRID_API_KEY exists:", !!process.env.SENDGRID_API_KEY);
  console.log("   SENDER_EMAIL:", process.env.SENDER_EMAIL);

  const token = jwt.sign(
    { email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const resetLink =
    `${process.env.FRONTEND_URL}/reset-password` +
    `?token=${token}&email=${encodeURIComponent(email)}`;

  console.log("🔹 STEP 4: Reset link generated");
  console.log("   Reset link:", resetLink);

  try {
    console.log("🔹 STEP 5: Calling SendGrid.send()");

    const response = await sgMail.send({
      to: email,
      from: process.env.SENDER_EMAIL,
      subject: "Password Reset Request",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `
    });

    console.log("✅ STEP 6: SendGrid SUCCESS");
    console.log("   SendGrid response:", response);

  } catch (error) {
    console.log("❌ STEP 6: SendGrid FAILED");

    if (error.response) {
      console.log("❌ SendGrid status:", error.response.statusCode);
      console.log(
        "❌ SendGrid body:",
        JSON.stringify(error.response.body, null, 2)
      );
    } else {
      console.log("❌ SendGrid error message:", error.message);
    }

    return res.status(500).json({
      error: "Failed to send reset email"
    });
  }

  res.json({
    ok: true,
    message: "If the email exists, a reset link has been sent"
  });
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


router.get("/request-reset", (req, res) => {
  res.status(200).json({
    ok: true,
    message:
      "This endpoint works via POST. Please use the Forgot Password page to request a reset link."
  });
});

router.get("/reset-password", (req, res) => {
  res.status(200).json({
    ok: true,
    message:
      "Password reset is handled via POST from the frontend Reset Password page."
  });
});

module.exports = router;
