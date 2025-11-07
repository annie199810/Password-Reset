// backend/utils/mailer.js
const nodemailer = require('nodemailer');

async function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // ✅ Use real SMTP if env vars are present
  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: port ? Number(port) : 587,
      secure: false,
      auth: { user, pass },
    });
  }

  // ✅ Otherwise fallback to Ethereal test account
  const testAccount = await nodemailer.createTestAccount();
  console.log("Using Ethereal test account:", testAccount.user);

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

async function sendResetEmail(toEmail, link) {
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"Password Reset" <no-reply@example.com>`,
      to: toEmail,
      subject: 'Password reset — GUVI task',
      html: `Click <a href="${link}">here</a> to reset your password. The link expires in 1 hour.`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    console.log('Mailer: messageId =', info.messageId, 'previewUrl =', previewUrl);

    return { ok: true, previewUrl };
  } catch (err) {
    console.error('Mailer error:', err.message || err);
    throw err;
  }
}

module.exports = { sendResetEmail };
