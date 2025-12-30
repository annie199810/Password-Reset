const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { sendResetEmail } = require("../utils/mailer");

console.log("✅ auth.js loaded");

const router = express.Router();

const DB_FILE =
  process.env.DB_FILE || path.join(__dirname, "..", "users.sqlite");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const BCRYPT_ROUNDS = 10;

/* ---------- DB ---------- */
function openDb() {
  console.log("📂 Opening database:", DB_FILE);
  return new sqlite3.Database(DB_FILE);
}

/* ---------- REGISTER ---------- */
router.post("/register", async (req, res) => {
  console.log("➡️ /register called");

  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email & password required" });

  const db = openDb();

  try {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        reset_token TEXT,
        reset_expires INTEGER
      )`
    );

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    db.run(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hash],
      err => {
        if (err) {
          console.error("❌ Register error:", err.message);
          return res.status(400).json({ error: "User exists" });
        }
        console.log("✅ User registered:", email);
        res.json({ ok: true });
      }
    );
  } finally {
    db.close();
  }
});

/* ---------- LOGIN ---------- */
router.post("/login", async (req, res) => {
  console.log("➡️ /login called");

  const { email, password } = req.body;
  const db = openDb();

  db.get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (!user) {
        console.log("❌ Login failed");
        return res.status(400).json({ error: "Invalid login" });
      }

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(400).json({ error: "Invalid login" });

      const token = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      console.log("✅ Login success:", email);
      res.json({ ok: true, token });
    }
  );
});

/* ---------- REQUEST RESET ---------- */
router.post("/request-reset", async (req, res) => {
  console.log("➡️ /request-reset called");

  const { email } = req.body;
  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 60 * 60 * 1000;

  const db = openDb();

  db.run(
    "UPDATE users SET reset_token=?, reset_expires=? WHERE email=?",
    [token, expires, email],
    async function () {
      console.log("🔄 Reset DB update changes:", this.changes);

      if (this.changes > 0) {
        console.log("📨 Email exists. Sending mail...");
        await sendResetEmail(email, token);
      } else {
        console.log("⚠️ Email not found, skipping mail");
      }

      res.json({
        ok: true,
        message: "If the email exists, reset link has been sent",
      });
    }
  );
});

/* ---------- RESET PASSWORD ---------- */
router.post("/reset-password", async (req, res) => {
  console.log("➡️ /reset-password called");

  const { email, token, password } = req.body;
  const db = openDb();

  db.get(
    "SELECT * FROM users WHERE email=? AND reset_token=?",
    [email, token],
    async (err, user) => {
      if (!user || user.reset_expires < Date.now()) {
        console.log("❌ Invalid or expired token");
        return res.status(400).json({ error: "Invalid token" });
      }

      const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      db.run(
        "UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?",
        [hash, user.id]
      );

      console.log("✅ Password reset success for:", email);
      res.json({ ok: true });
    }
  );
});

module.exports = router;
