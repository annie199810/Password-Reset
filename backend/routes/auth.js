
const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const { sendResetEmail } = require('../utils/mailer');


router.use((req, res, next) => {
  console.log(`[AUTH ROUTER] ${req.method} ${req.originalUrl}`);
  next();
});


router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Auth router is mounted',
    available: [
      'POST /request-reset',
      'POST /reset-password',
      'GET /debug-users'
    ]
  });
});


router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      console.error('DB select error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = uuidv4();
    const expires = Date.now() + 3600 * 1000; // 1 hour expiry

    db.run(
      'UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?',
      [token, expires, email],
      async function (uErr) {
        if (uErr) {
          console.error('DB update error:', uErr);
          return res.status(500).json({ error: 'DB error saving token' });
        }

        if (this.changes === 0) {
          console.warn('DB update affected 0 rows for', email);
          return res.status(404).json({ error: 'No matching user to update' });
        }

        console.log('✅ DB saved reset token for', email, 'token=', token);

        const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

        try {
          const previewUrl = await sendResetEmail(email, link);
          return res.json({ ok: true, previewUrl });
        } catch (mailErr) {
          console.error('Mailer error:', mailErr);
          return res.status(500).json({ error: 'Failed to send email' });
        }
      }
    );
  });
});


router.post('/reset-password', async (req, res) => {
  const { email, token, password } = req.body;
  if (!email || !token || !password)
    return res.status(400).json({ error: 'Missing fields' });

  db.get(
    'SELECT * FROM users WHERE email = ? AND reset_token = ?',
    [email, token],
    async (err, user) => {
      if (err) {
        console.error('DB select error:', err);
        return res.status(500).json({ error: 'DB error' });
      }

      if (!user) return res.status(400).json({ error: 'Invalid token or email' });

      if (!user.reset_expires || Date.now() > user.reset_expires)
        return res.status(400).json({ error: 'Token expired' });

      try {
        const hashed = await bcrypt.hash(password, 10);
        db.run(
          'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE email = ?',
          [hashed, email],
          (uErr) => {
            if (uErr) {
              console.error('DB update error:', uErr);
              return res.status(500).json({ error: 'DB error' });
            }
            console.log('✅ Password reset successful for', email);
            return res.json({ ok: true });
          }
        );
      } catch (hashErr) {
        console.error('Hashing error:', hashErr);
        return res.status(500).json({ error: 'Hash error' });
      }
    }
  );
});


/*router.get('/debug-users', (req, res) => {
  db.all('SELECT email, reset_token, reset_expires FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});*/


module.exports = router;
