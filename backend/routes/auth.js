
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { sendResetEmail } = require('../utils/mailer');
const bcrypt = require('bcrypt');

const router = express.Router();

const dbFile = path.join(__dirname, '..', 'users.sqlite');

function openDb() {
  return new sqlite3.Database(dbFile);
}


router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    const token = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60; // 1 hour

    const db = openDb();
    db.run(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?',
      [token, expires, email],
      async function (err) {
        if (err) {
          console.error('DB update error:', err);
          return res.status(500).json({ error: 'internal' });
        }

        if (this.changes === 0) {
          
          return res.status(200).json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
        }

        const result = await sendResetEmail(email, token);

        return res.json({
          ok: true,
          message: 'reset link generated',
          previewUrl: result.previewUrl || null,
          fallbackLink: result.fallbackLink || null
        });
      }
    );
    db.close();
  } catch (err) {
    console.error('request-reset error ->', err);
    return res.status(500).json({ error: 'internal' });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'token and password required' });

    const db = openDb();
    db.get('SELECT id, reset_expires FROM users WHERE reset_token = ?', [token], async (err, row) => {
      if (err) {
        console.error('DB get error:', err);
        return res.status(500).json({ error: 'internal' });
      }
      if (!row) return res.status(400).json({ error: 'Invalid token' });
      if (row.reset_expires < Date.now()) return res.status(400).json({ error: 'Token expired' });

      
      const hashed = await bcrypt.hash(password, 10);
      db.run('UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', [hashed, row.id], function (uerr) {
        if (uerr) {
          console.error('DB update password error:', uerr);
          return res.status(500).json({ error: 'internal' });
        }
        return res.json({ ok: true, message: 'Password changed successfully' });
      });
    });
    db.close();
  } catch (err) {
    console.error('reset-password error ->', err);
    return res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
