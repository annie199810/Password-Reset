const express = require('express');
const crypto = require('crypto');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { sendResetEmail } = require('../utils/mailer');
const bcrypt = require('bcrypt');

const router = express.Router();

// ✅ Use persistent DB path (Render → /data/users.sqlite)
const dbFile = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'users.sqlite');

// Helper function to open DB
function openDb() {
  return new sqlite3.Database(dbFile, (err) => {
    if (err) console.error('Failed to open DB:', err);
  });
}

/* =============================
   REQUEST RESET LINK
   ============================= */
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
          console.warn(`Email not found: ${email}`);
          return res.status(200).json({ ok: true, message: 'If the email exists, a reset link has been sent.' });
        }

        // Send email (or fallback)
        const result = await sendResetEmail(email, token);

        console.log('✅ Reset token generated for', email);
        if (result.fallbackLink) console.log('FALLBACK RESET LINK:', result.fallbackLink);
        if (result.previewUrl) console.log('📬 Preview URL:', result.previewUrl);

        return res.json({
          ok: true,
          message: 'reset link generated',
          previewUrl: result.previewUrl || null,
          fallbackLink: result.fallbackLink || null,
        });
      }
    );
    db.close();
  } catch (err) {
    console.error('request-reset error ->', err);
    return res.status(500).json({ error: 'internal' });
  }
});

/* =============================
   RESET PASSWORD
   ============================= */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ error: 'token and password required' });

    const db = openDb();
    db.get(
      'SELECT id, reset_expires FROM users WHERE reset_token = ?',
      [token],
      async (err, row) => {
        if (err) {
          console.error('DB get error:', err);
          return res.status(500).json({ error: 'internal' });
        }

        if (!row) return res.status(400).json({ error: 'Invalid token' });
        if (row.reset_expires < Date.now())
          return res.status(400).json({ error: 'Token expired' });

        const hashed = await bcrypt.hash(password, 10);
        db.run(
          'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?',
          [hashed, row.id],
          function (uerr) {
            if (uerr) {
              console.error('DB update password error:', uerr);
              return res.status(500).json({ error: 'internal' });
            }
            console.log(`✅ Password reset successful for user id ${row.id}`);
            return res.json({ ok: true, message: 'Password changed successfully' });
          }
        );
      }
    );
    db.close();
  } catch (err) {
    console.error('reset-password error ->', err);
    return res.status(500).json({ error: 'internal' });
  }
});

module.exports = router;
