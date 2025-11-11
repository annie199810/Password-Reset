
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { sendResetEmail } = require('../utils/mailer');

const router = express.Router();


const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'users.sqlite');

function openDb() {
  return new sqlite3.Database(dbFile, (err) => {
    if (err) console.error('Open DB error:', err);
  });
}


router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const token = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; 

    const db = openDb();
    db.run(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?',
      [token, expires, email],
      async function (err) {
        if (err) {
          console.error('DB update error:', err);
          db.close();
          return res.status(500).json({ error: 'internal' });
        }

        if (this.changes === 0) {
          console.warn('Request-reset: email not found:', email);
          db.close();
          return res.status(200).json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
        }

        
        let result = { fallbackLink: null, previewUrl: null };
        try {
          result = await sendResetEmail(email, token);
        } catch (mailErr) {
          console.error('sendResetEmail error:', mailErr);
        }

        console.log('✅ Reset token created for', email);
        if (result.fallbackLink) console.log('FALLBACK RESET LINK:', result.fallbackLink);
        if (result.previewUrl) console.log('Preview URL:', result.previewUrl);

        db.close();
        return res.json({
          ok: true,
          message: 'reset link generated',
          previewUrl: result.previewUrl || null,
          fallbackLink: result.fallbackLink || null
        });
      }
    );
  } catch (err) {
    console.error('request-reset error ->', err);
    return res.status(500).json({ error: 'internal' });
  }
});


router.get('/verify-reset', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  const db = openDb();
  db.get('SELECT id FROM users WHERE reset_token = ? AND reset_expires > ?', [token, Date.now()], (err, row) => {
    db.close();
    if (err) {
      console.error('verify-reset DB error:', err);
      return res.status(500).json({ error: 'internal' });
    }
    if (!row) return res.status(400).json({ error: 'Invalid or expired token' });
    return res.json({ ok: true });
  });
});


router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'token and password required' });

    const db = openDb();
    db.get('SELECT id, reset_expires FROM users WHERE reset_token = ?', [token], async (err, row) => {
      if (err) {
        console.error('DB get error:', err);
        db.close();
        return res.status(500).json({ error: 'internal' });
      }
      if (!row) {
        db.close();
        return res.status(400).json({ error: 'Invalid token' });
      }
      if (row.reset_expires < Date.now()) {
        db.close();
        return res.status(400).json({ error: 'Token expired' });
      }

      const hashed = await bcrypt.hash(password, 10);
      db.run('UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', [hashed, row.id], function (uerr) {
        db.close();
        if (uerr) {
          console.error('DB update password error:', uerr);
          return res.status(500).json({ error: 'internal' });
        }
        console.log('✅ Password reset for user id', row.id);
        return res.json({ ok: true, message: 'Password changed successfully' });
      });
    });
  } catch (err) {
    console.error('reset-password error ->', err);
    return res.status(500).json({ error: 'internal' });
  }
});


router.get('/debug-tokens', (req, res) => {
  try {
    const db = openDb();
    db.all('SELECT id, email, reset_token, reset_expires FROM users', [], (err, rows) => {
      db.close();
      if (err) {
        console.error('debug-tokens db error:', err);
        return res.status(500).json({ error: 'db' });
      }
      const out = rows.map(r => ({
        id: r.id,
        email: r.email,
        reset_token: r.reset_token,
        reset_expires: r.reset_expires,
        expires_date: r.reset_expires ? new Date(r.reset_expires).toISOString() : null
      }));
      return res.json(out);
    });
  } catch (e) {
    console.error('debug-tokens exception', e);
    return res.status(500).json({ error: 'internal' });
  }
});


router.post('/debug-seed', async (req, res) => {
  try {
    const db = openDb();
    const seedEmail = process.env.SEED_EMAIL || 'test@example.com';
    const seedPassword = process.env.SEED_PASSWORD || 'Test@1234';
    const hashed = await bcrypt.hash(seedPassword, 10);

    db.run('INSERT OR IGNORE INTO users (email, password) VALUES (?, ?)', [seedEmail, hashed], function (err) {
      db.close();
      if (err) {
        console.error('debug-seed error:', err);
        return res.status(500).json({ error: 'db' });
      }
      return res.json({ ok: true, message: `seeded ${seedEmail}`, inserted: this.changes });
    });
  } catch (e) {
    console.error('debug-seed exception', e);
    return res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
