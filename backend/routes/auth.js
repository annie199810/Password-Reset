const express = require('express');
const crypto = require('crypto');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendResetEmail } = require('../utils/mailer');

const router = express.Router();

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'users.sqlite');
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';


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

function normalizeEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}


router.get('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = openDb(true);
    try {
      const row = await dbGet(db, 'SELECT id, email FROM users WHERE id = ?', [
        payload.id
      ]);
      if (!row) return res.status(404).json({ error: 'User not found' });
      return res.json({ ok: true, user: row });
    } finally {
      db.close();
    }
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});


router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  const emailNorm = normalizeEmail(email);

  if (!emailNorm || !password) {
    return res.status(400).json({ error: 'email and password required' });
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

    const existing = await dbGet(db, 'SELECT id FROM users WHERE email = ?', [
      emailNorm
    ]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await dbRun(db, 'INSERT INTO users (email, password) VALUES (?, ?)', [
      emailNorm,
      hashed
    ]);

    return res.json({ ok: true, message: 'Registered successfully' });
  } catch {
    return res.status(500).json({ error: 'internal' });
  } finally {
    db.close();
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const emailNorm = normalizeEmail(email);

  if (!emailNorm || !password) {
    return res.status(400).json({ error: 'email and password required' });
  }

  const db = openDb(true);
  try {
    const row = await dbGet(db, 'SELECT id, password FROM users WHERE email = ?', [
      emailNorm
    ]);
    if (!row) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: row.id, email: emailNorm }, JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.json({ ok: true, token });
  } catch {
    return res.status(500).json({ error: 'internal' });
  } finally {
    db.close();
  }
});


router.post('/request-reset', async (req, res) => {
  const { email } = req.body || {};
  const emailNorm = normalizeEmail(email);

  if (!emailNorm) {
    return res.status(400).json({ error: 'email required' });
  }

  const token = crypto.randomBytes(20).toString('hex');
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour

  const db = openDb();
  try {
    const update = await dbRun(
      db,
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?',
      [token, expires, emailNorm]
    );


    if (!update.changes) {
      return res.json({
        ok: true,
        message: 'If the email exists, a reset link has been sent to your email.'
      });
    }

   
    try {
      await sendResetEmail(emailNorm, token);
    } catch (err) {
      console.error('Email send failed (ignored for demo):', err.message);
    }

    return res.json({
      ok: true,
      message: 'If the email exists, a reset link has been sent to your email.'
    });
  } catch {
    return res.status(500).json({ error: 'internal' });
  } finally {
    db.close();
  }
});


router.post('/reset-password', async (req, res) => {
  const { token, email, password } = req.body || {};
  const emailNorm = normalizeEmail(email);

  if (!token || !emailNorm || !password) {
    return res.status(400).json({ error: 'token, email and password required' });
  }

  const db = openDb();
  try {
    const row = await dbGet(
      db,
      'SELECT id, reset_expires FROM users WHERE reset_token = ? AND email = ?',
      [token, emailNorm]
    );

    if (!row) return res.status(400).json({ error: 'Invalid token' });
    if (row.reset_expires < Date.now()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await dbRun(
      db,
      'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
      [hashed, row.id]
    );

    return res.json({ ok: true, message: 'Password reset successful' });
  } catch {
    return res.status(500).json({ error: 'internal' });
  } finally {
    db.close();
  }
});

module.exports = router;
