const express = require("express");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const { sendResetEmail } = require("../utils/mailer");

console.log("✅ auth.js loaded");

const router = express.Router();

const DB_FILE =
  process.env.DB_FILE || path.join(__dirname, "..", "users.sqlite");

// Open DB
function openDb() {
  return new sqlite3.Database(DB_FILE);
}

// Normalize email
function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/**
 * REQUEST RESET
 * POST /api/auth/request-reset
 */
router.post("/request-reset", (req, res) => {
  const email = normalizeEmail(req.body.email);

  console.log("📨 Password reset requested for:", email);

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour

  const db = openDb();

  db.run(
    `UPDATE users SET reset_token=?, reset_expires=? WHERE email=?`,
    [token, expires, email],
    async function (err) {
      if (err) {
        console.error("❌ DB error:", err.message);
        return res.status(500).json({ error: "Database error" });
      }

      // Always return success message (security)
      if (this.changes === 0) {
        console.log("⚠️ Email not found (still returning OK)");
        return res.json({
          ok: true,
          message: "If the email exists, reset link has been sent",
        });
      }

      try {
        await sendResetEmail(email, token);
      } catch (e) {
        console.error("❌ Email send failed:", e.message);
      }

      res.json({
        ok: true,
        message: "If the email exists, reset link has been sent",
      });
    }
  );
});

/**
 * RESET PASSWORD
 * POST /api/auth/reset-password
 */
router.post("/reset-password", (req, res) => {
  const { email, token, password } = req.body;

  console.log("🔁 Reset password attempt for:", email);

  if (!email || !token || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const db = openDb();

  db.get(
    `SELECT * FROM users WHERE email=? AND reset_token=?`,
    [email, token],
    (err, user) => {
      if (err || !user) {
        console.error("❌ Invalid token");
        return res.status(400).json({ error: "Invalid token" });
      }

      if (user.reset_expires < Date.now()) {
        console.error("❌ Token expired");
        return res.status(400).json({ error: "Token expired" });
      }

      db.run(
        `UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE email=?`,
        [password, email],
        () => {
          console.log("✅ Password reset successful");
          res.json({ ok: true, message: "Password reset successful" });
        }
      );
    }
  );
});

module.exports = router;
