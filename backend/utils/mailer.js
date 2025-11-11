// backend/utils/mailer.js
const nodemailer = require('nodemailer');

const host = process.env.EMAIL_HOST || 'smtp.ethereal.email';
const port = Number(process.env.EMAIL_PORT) || 587;
const user = process.env.EMAIL_USER || '';
const pass = process.env.EMAIL_PASS || '';

let transporter;

if (user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    },
    // optional timeouts for production
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
} else {
  // No credentials -> create a test account (useful for local dev)
  transporter = null;
}

async function sendResetEmail(toEmail, resetToken) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(toEmail)}`;

  // If no configured transporter, create a test account (development)
  let usedTransporter = transporter;
  let createdTestAccount = null;
  if (!usedTransporter) {
    createdTestAccount = await nodemailer.createTestAccount();
    usedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: createdTestAccount.user,
        pass: createdTestAccount.pass
      }
    });
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL || '"Secure App" <no-reply@secureapp.com>',
    to: toEmail,
    subject: 'Password reset',
    text: `Reset link: ${resetLink}`,
    html: `<p>Click to reset your password: <a href="${resetLink}">${resetLink}</a></p>`
  };

  try {
    const info = await usedTransporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    console.log('mailer -> messageId:', info.messageId, 'previewUrl:', previewUrl);
    return { info, previewUrl };
  } catch (err) {
    // Log error and rethrow so caller can return fallback link
    console.error('sendMail error:', err);
    throw err;
  } finally {
    if (createdTestAccount && usedTransporter && usedTransporter.close) {
      try { usedTransporter.close(); } catch (e) {}
    }
  }
}

module.exports = { sendResetEmail };
