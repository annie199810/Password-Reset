// backend/utils/mailer.js
const nodemailer = require('nodemailer');

async function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  // If explicit SMTP credentials are provided, try to use them.
  // (Note: on some hosting providers outgoing SMTP to Gmail is blocked — Ethereal is fallback.)
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: port ? Number(port) : 587,
        secure: false,
        auth: { user, pass },
        // optional timeouts (reduce hanging)
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      // verify transporter works quickly (will throw if cannot connect)
      await transporter.verify();
      console.log('Mailer: using provided SMTP server', host);
      return { transporter, previewFn: () => null };
    } catch (err) {
      console.warn('Mailer: failed to use provided SMTP (falling back to Ethereal).', err && err.message);
      // fall through to Ethereal
    }
  }

  // Create Ethereal test account and transporter
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });

  console.log('Using Ethereal test account:', testAccount.user);
  return { transporter, previewFn: info => nodemailer.getTestMessageUrl(info) || null };
}

async function sendResetEmail(toEmail, link) {
  const { transporter, previewFn } = await createTransporter();

  const info = await transporter.sendMail({
    from: `"Password Reset" <no-reply@example.com>`,
    to: toEmail,
    subject: 'Password reset — GUVI task',
    html: `Click <a href="${link}">here</a> to reset your password. The link expires in 1 hour.`,
  });

  const previewUrl = previewFn(info) || null;
  console.log('Mailer: messageId=', info.messageId, 'previewUrl=', previewUrl);
  return { ok: true, previewUrl };
}

module.exports = { sendResetEmail };
