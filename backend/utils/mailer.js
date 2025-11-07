const nodemailer = require('nodemailer');

async function createTransporter() {

  const testAccount = await nodemailer.createTestAccount();

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
  const transporter = await createTransporter();

  const info = await transporter.sendMail({
    from: '"Password Reset" <no-reply@example.com>',
    to: toEmail,
    subject: 'Password reset — GUVI task',
    html: `Click <a href="${link}">here</a> to reset your password. This link expires in 1 hour.`,
  });

  console.log('✅ Mail sent:', nodemailer.getTestMessageUrl(info));
  return { ok: true, previewUrl: nodemailer.getTestMessageUrl(info) };
}

module.exports = { sendResetEmail };
