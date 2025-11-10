
const express = require('express');
const crypto = require('crypto');
const { sendResetEmail } = require('../mail'); 
const router = express.Router();

router.post('/request-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });

    
    const token = crypto.randomBytes(20).toString('hex');

    const info = await sendResetEmail(email, token);
    
    return res.json({ ok: true, messageId: info && info.messageId ? info.messageId : null });
  } catch (err) {
    console.error('request-reset error', err);
    return res.status(500).json({ error: err.message || 'internal' });
  }
});

module.exports = router;
