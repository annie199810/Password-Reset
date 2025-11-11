
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { sendResetEmail } = require('../utils/mailer');

const router = express.Router();


const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'users.sqlite');

function openDb(mode = sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE) {
  return new sqlite3.Database(dbFile, mode, (err) => {
    if (err) {
      console.error('Open DB error:', err && err.message ? err.message : err);
    }
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
          console.error('DB update error (request-reset):', err);
          db.close();
          return res.status(500).json({ error: 'internal' });
        }

        
        if (this.changes === 0) {
          db.close();
          return res.json({
            ok: true,
            message: 'If the email exists, a reset link has been sent.'
          });
        }

        
        try {
          const result = await sendResetEmail(email, token);
          db.close();
          const previewUrl = result && result.previewUrl ? result.previewUrl : null;
          const fallbackLink =
            `${(process.env.FRONTEND_URL || 'http://localhost:3000')}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

          return res.json({
            ok: true,
            message: 'reset link generated',
            previewUrl,
            fallbackLink
          });
        } catch (mailErr) {
          
          console.error('sendMail error:', mailErr && mailErr.stack ? mailErr.stack : mailErr);
          const fallbackLink =
            `${(process.env.FRONTEND_URL || 'http://localhost:3000')}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
          db.close();
          return res.json({
            ok: true,
            message: 'reset link generated (fallback)',
            previewUrl: null,
            fallbackLink
          });
        }
      }
    );
  } catch (err) {
    console.error('request-reset error ->', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal' });
  }
});


router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, email } = req.body;

    
    if (!token || !password || !email) {
      return res.status(400).json({ error: 'token, email and password required' });
    }

    
    console.log('reset-password request body:', { email, token: String(token).slice(0, 10) + '...' });

    const db = openDb(sqlite3.OPEN_READWRITE);

    db.get(
      'SELECT id, reset_expires, reset_token FROM users WHERE reset_token = ? AND email = ?',
      [token, email],
      async (err, row) => {
        if (err) {
          console.error('DB get error (reset-password):', err);
          db.close();
          return res.status(500).json({ error: 'internal' });
        }

        if (!row) {
          console.log('No user found for token/email during reset-password');
          db.close();
          return res.status(400).json({ error: 'Invalid token' });
        }

        if (!row.reset_expires || Number(row.reset_expires) < Date.now()) {
          db.close();
          return res.status(400).json({ error: 'Token expired' });
        }

        try {
          const hashed = await bcrypt.hash(password, 10);
          db.run(
            'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
            [hashed, row.id],
            function (uerr) {
              if (uerr) {
                console.error('DB update password error:', uerr);
                db.close();
                return res.status(500).json({ error: 'internal' });
              }
              db.close();
              return res.json({ ok: true, message: 'Password changed successfully' });
            }
          );
        } catch (hashErr) {
          console.error('Hash error (reset-password):', hashErr);
          db.close();
          return res.status(500).json({ error: 'internal' });
        }
      }
    );
  } catch (err) {
    console.error('reset-password error ->', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'internal' });
  }
});


if (process.env.DEBUG === 'true') {
  router.get('/debug-tokens', (req, res) => {
    const db = openDb(sqlite3.OPEN_READONLY);
    db.all('SELECT email, reset_token, reset_expires FROM users WHERE reset_token IS NOT NULL', [], (err, rows) => {
      if (err) {
        console.error('debug-tokens db error:', err);
        db.close();
        return res.status(500).json({ error: 'internal' });
      }
      db.close();
      
      const out = (rows || []).map((r) => ({
        email: r.email,
        reset_token: r.reset_token,
        reset_expires: r.reset_expires,
      }));
      return res.json(out);
    });
  });
}

module.exports = router;
