const express = require("express");
const crypto = require("crypto");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendResetEmail } = require("../utils/mailer");

const router = express.Router();

const DB_FILE = process.env.DB_FILE || path.join(__dirname, "..", "users.sqlite");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const BCRYPT_ROUNDS = 10;

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
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};
  const emailNorm = normalizeEmail(email);

  if (!emailNorm || !password)
    return res.status(400).json({ error: "email & password required" });

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

    const existing = await dbGet(db, "SELECT id FROM users WHERE email=?", [
      emailNorm
    ]);
    if (existing)
      return res.status(400).json({ error: "Email already exists" });

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await dbRun(db, "INSERT INTO users (email,password) VALUES (?,?)", [
      emailNorm,
      hash
    ]);

    res.json({ ok: true });
  } finally {
    db.close();
  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const emailNorm = normalizeEmail(email);

  const db = openDb(true);
  try {
    const user = await dbGet(db, "SELECT * FROM users WHERE email=?", [
      emailNorm
    ]);
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ ok: true, token });
  } finally {
    db.close();
  }
});

/* =========================
   FORGOT PASSWORD (⭐ MAIN ⭐)
========================= */
router.post("/request-reset", async (req, res) => {
  const emailNorm = normalizeEmail(req.body.email);
  if (!emailNorm)
    return res.status(400).json({ error: "email required" });

  const token = crypto.randomBytes(20).toString("hex");
  const expires = Date.now() + 60 * 60 * 1000;

  const db = openDb();
  try {
    const result = await dbRun(
      db,
      "UPDATE users SET reset_token=?, reset_expires=? WHERE email=?",
      [token, expires, emailNorm]
    );

    if (!result.changes) {
      return res.json({ ok: true });
    }

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${emailNorm}`;

    console.log("🔑 Reset token:", token);
    console.log("🔗 Reset link:", resetLink);

    try {
      await sendResetEmail(emailNorm, token);
    } catch (e) {
      console.error("Email error:", e.message);
    }

    // ⭐ RETURN LINK FOR DEMO ⭐
    res.json({
      ok: true,
      demoResetLink: resetLink
    });
  } finally {
    db.close();
  }
});

/* =========================
   RESET PASSWORD
========================= */
router.post("/reset-password", async (req, res) => {
  const { email, token, password } = req.body || {};
  const emailNorm = normalizeEmail(email);

  const db = openDb();
  try {
    const user = await dbGet(
      db,
      "SELECT id, reset_expires FROM users WHERE email=? AND reset_token=?",
      [emailNorm, token]
    );

    if (!user) return res.status(400).json({ error: "Invalid token" });
    if (user.reset_expires < Date.now())
      return res.status(400).json({ error: "Token expired" });

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await dbRun(
      db,
      "UPDATE users SET password=?, reset_token=NULL, reset_expires=NULL WHERE id=?",
      [hash, user.id]
    );

    res.json({ ok: true });
  } finally {
    db.close();
  }
});

module.exports = router;
