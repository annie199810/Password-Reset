const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { sendResetEmail } = require("../utils/mailer");

const router = express.Router();

/* ================== CONFIG ================== */
const DB_FILE =
  process.env.DB_FILE || path.join(__dirname, "..", "users.sqlite");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const BCRYPT_ROUNDS = 10;

/* ================== DB HELPERS ================== */
function openDb(readonly = false) {
  return new sqlite3.Database(
    DB_FILE,
    readonly
      ? sqlite3.OPEN_READONLY
      : sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE
  );
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/* ================== REGISTER ================== */
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const emailNorm = normalizeEmail(email);

  if (!emailNorm || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const db = openDb();
  try {
    await dbRun(
      db,
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        reset_token TEXT,
        reset_expires INTEGER
      )`
    );

    const existing = await dbGet(
      db,
      "SELECT id FROM users WHERE email = ?",
      [emailNorm]
    );
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await dbRun(
      db,
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [emailNorm, hash]
    );

    res.json({ ok: true, message: "Registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    db.close();
  }
});

/* ================== LOGIN ================== */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const emailNorm = normalizeEmail(email);

  if (!emailNorm || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const db = openDb(true);
  try {
    const user = await dbGet(
      db,
      "SELECT id, password FROM users WHERE email = ?",
      [emailNorm]
    );

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: emailNorm },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ ok: true, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    db.close();
  }
});

/* ================== REQUEST RESET ================== */
router.post("/request-reset", async (req, res) => {
  const { email } = req.body;
  const emailNorm = normalizeEmail(email);

  if (!emailNorm) {
    return res.status(400).json({ error: "Email required" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour

  const db = openDb();
  try {
    const result = await dbRun(
      db,
      "UPDATE users SET reset_token=?, reset_expires=? WHERE email=?",
      [token, expires, emailNorm]
    );

    // Always return same message (security best practice)
    if (result.changes > 0) {
      try {
        await sendResetEmail(emailNorm, token);
        console.log("✅ Reset email sent to:", emailNorm);
      } catch (mailErr) {
        console.error("❌ Email send failed:", mailErr);
      }
    }

    res.json({
      ok: true,
      message: "If the email exists, a reset link has been sent"
    });
  } catch (err) {
    console.error("Request reset error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    db.close();
  }
});

/* ================== RESET PASSWORD ================== */
router.post("/reset-password", async (req, res) => {
  const { email, token, password } = req.body;
  const emailNorm = normalizeEmail(email);

  if (!emailNorm || !token || !password) {
    return res
      .status(400)
      .json({ error: "Email, token and password required" });
  }

  const db = openDb();
  try {
    const user = await dbGet(
      db,
      `SELECT id, reset_expires FROM users 
       WHERE email=? AND reset_token=?`,
      [emailNorm, token]
    );

    if (!user) {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    if (user.reset_expires < Date.now()) {
      return res.status(400).json({ error: "Token expired" });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await dbRun(
      db,
      `UPDATE users 
       SET password=?, reset_token=NULL, reset_expires=NULL 
       WHERE id=?`,
      [hash, user.id]
    );

    res.json({ ok: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    db.close();
  }
});

module.exports = router;
