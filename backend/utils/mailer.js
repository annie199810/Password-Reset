
const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null;
  try {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
  } catch (e) {
    console.error('createTransporter error', e);
    return null;
  }
}

async function sendResetEmail(toEmail, resetToken) {
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  
  const resetLink = `${frontend}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(toEmail)}`;

  const transporter = createTransporter();
  if (!transporter) {
    console.warn('No SMTP transporter available — returning fallback link only');
    return { fallbackLink: resetLink, previewUrl: null };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || '"Your App" <no-reply@yourapp.com>',
      to: toEmail,
      subject: 'Password reset',
      text: `Reset link: ${resetLink}`,
      html: `<p>Click to reset: <a href="${resetLink}">${resetLink}</a></p>`
    });
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    console.log('mailer -> messageId:', info.messageId, 'previewUrl:', previewUrl);
    return { fallbackLink: resetLink, previewUrl };
  } catch (err) {
    console.error('sendMail error:', err);
    return { fallbackLink: resetLink, previewUrl: null };
  }
}

module.exports = { sendResetEmail };
