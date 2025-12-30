console.log("✅ auth.js loaded");

const express = require("express");
const jwt = require("jsonwebtoken");
const { sendResetEmail } = require("../utils/mailer");

const router = express.Router();


router.post("/request-reset", async (req, res) => {
  try {
    const { email } = req.body;
    //console.log("📩 Reset request received for:", email);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // 🔑 Generate JWT token (valid for 1 hour)
    const token = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

   
    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password` +
      `?token=${token}&email=${encodeURIComponent(email)}`;

    //console.log("🔗 Reset link generated:", resetLink);

    
    try {
      await sendResetEmail(email, resetLink);
      //console.log("✅ Reset email sent successfully");
    } catch (mailErr) {
     // console.error("❌ Email sending failed:", mailErr);
      
    }

    
    res.json({
      ok: true,
      message: "If the email exists, a reset link has been sent",
      demoResetLink: resetLink 
    });

  } catch (err) {
    //console.error("🔥 request-reset error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.post("/reset-password", async (req, res) => {
  try {
    const { token, email, password } = req.body;
   // console.log("🔁 Reset password attempt:", email);

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

   
   // console.log("✅ Token verified, password reset allowed");

    res.json({
      ok: true,
      message: "Password reset successful"
    });

  } catch (err) {
    //console.error("🔥 reset-password error:", err);
    res.status(400).json({
      error: "Invalid or expired reset link"
    });
  }
});

module.exports = router;
