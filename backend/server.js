const express = require("express");
const crypto = require("crypto");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendResetEmail } = require("../utils/mailer");

const router = express.Router();
const DB_FILE = process.env.DB_FILE || "/tmp/users.sqlite";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const BCRYPT_ROUNDS = 10;

function openDb() {
  return new sqlite3.Database(DB_FILE);
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/* ---------------- REGISTER ---------------- */
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const emailNorm = normalizeEmail(email);

  if (!emailNorm || !password)
    return res.status(400).json({ error: "Email & password required" });

  const db = openDb();
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
    "INSERT INTO users (email, password) VALUES (?,?)",
    [emailNorm, hash],
    err => {
      if (err) return res.status(400).json({ error: "Email exists" });
      res.json({ ok: true });
    }
  );
});

/* ---------------- LOGIN ---------------- */
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const emailNorm = normalizeEmail(email);
  const db = openDb();

  db.get(
    "SELECT * FROM users WHERE email=?",
    [emailNorm],
    async (err, user) => {
      if (!user) return res.status(400).json({ error: "Invalid login" });

      const ok = await bcrypt.compare(password, user.password);
      if (!ok) return res.status(400).json({ error: "Invalid login" });

      const token = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      res.json({ ok: true, token });
    }
  );
});

/* ---------------- REQUEST RESET ---------------- */
router.post("/request-reset", async (req, res) => {
  const emailNorm = normalizeEmail(req.body.email);
  if (!emailNorm)
    return res.status(400).json({ error: "Email required" });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 60 * 60 * 1000;

  const db = openDb();
  db.run(
    "UPDATE users SET reset_token=?, reset_expires=? WHERE email=?",
    [token, expires, emailNorm],
    async function () {
      if (this.changes) {
        await sendResetEmail(emailNorm, token);
      }
      res.json({
        ok: true,
        message: "If the email exists, reset link has been sent",
      });
    }
  );
});

/* ---------------- RESET PASSWORD ---------------- */
router.post("/reset-password", async (req, res) => {
  const { token, email, password } = req.body;
  const emailNorm = normalizeEmail(email);
  const db = openDb();

  db.get(
    "SELECT * FROM users WHERE email=? AND reset_token=?",
    [emailNorm, token],
    async (err, user) => {
      if (!user) return res.status(400).json({ error: "Invalid token" });
      if (user.reset_expires < Date.now())
        return res.status(400).json({ error: "Token expired" });

      const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      db.run(
        "UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?",
        [hash, user.id]
      );

      res.json({ ok: true, message: "Password reset successful" });
    }
  );
});

module.exports = router;
