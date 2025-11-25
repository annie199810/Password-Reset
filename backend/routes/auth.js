
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendResetEmail } = require('../utils/mailer');

const router = express.Router();

const DB_FILE = process.env.DB_FILE || path.join(__dirname, '..', 'users.sqlite');

function openDb(readonly = false) {
  return new sqlite3.Database(
    DB_FILE,
    readonly ? sqlite3.OPEN_READONLY : (sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE)
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

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';


router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const db = openDb();
  try {
    
    await dbRun(db, `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      reset_token TEXT,
      reset_expires INTEGER
    )`, []);

    const existing = await dbGet(db, 'SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await dbRun(db, 'INSERT INTO users (email, password) VALUES (?, ?)', [email, hashed]);

    return res.json({ ok: true, message: 'Registered' });
  } catch (err) {
    console.error('register error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal' });
  } finally {
    db.close();
  }
});


router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const db = openDb(true);
  try {
    const row = await dbGet(db, 'SELECT id, password FROM users WHERE email = ?', [email]);
    if (!row) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: row.id, email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ ok: true, token });
  } catch (err) {
    console.error('login error', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal' });
  } finally {
    db.close();
  }
});



router.post('/request-reset', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email required' });

  const token = crypto.randomBytes(20).toString('hex');
  const expires = Date.now() + 1000 * 60 * 60; 

  const db = openDb();
  try {
    const update = await dbRun(
      db,
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?',
      [token, expires, email]
    );

    
    if (!update.changes) {
      return res.json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
    }

   
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const fallbackLink = `${frontend.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    let mailResult = null;
    try {
      mailResult = await sendResetEmail(email, token);
    } catch (mailErr) {
      console.error('sendResetEmail error:', mailErr && mailErr.stack ? mailErr.stack : mailErr);
    }

    return res.json({
      ok: true,
      message: mailResult ? 'reset link generated' : 'reset token created (email delivery failed)',
      previewUrl: mailResult && mailResult.previewUrl ? mailResult.previewUrl : null,
      fallbackLink
    });
  } catch (err) {
    console.error('request-reset DB error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal' });
  } finally {
    db.close();
  }
});


router.post('/reset-password', async (req, res) => {
  const { token, email, password } = req.body || {};
  if (!token || !email || !password) return res.status(400).json({ error: 'token, email and password required' });

  const db = openDb();
  try {
    const row = await dbGet(db, 'SELECT id, reset_expires FROM users WHERE reset_token = ? AND email = ?', [token, email]);
    if (!row) return res.status(400).json({ error: 'Invalid token' });

    if (!row.reset_expires || Number(row.reset_expires) < Date.now()) {
      return res.status(400).json({ error: 'Token expired' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await dbRun(db, 'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', [hashed, row.id]);

    return res.json({ ok: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('reset-password error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal' });
  } finally {
    db.close();
  }
});


router.get('/debug-tokens', async (req, res) => {
  const db = openDb(true);
  db.all('SELECT email, reset_token, reset_expires FROM users', [], (err, rows) => {
    if (err) {
      console.error('debug-tokens error:', err);
      db.close();
      return res.status(500).json({ error: 'internal' });
    }
    db.close();
    return res.json(rows || []);
  });
});

module.exports = router;
