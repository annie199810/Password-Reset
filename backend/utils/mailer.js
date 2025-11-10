
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendResetEmail(toEmail, resetToken) {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || '"Your App" <no-reply@yourapp.com>',
    to: toEmail,
    subject: 'Password reset',
    text: `Reset link: ${resetLink}`,
    html: `<p>Click to reset: <a href="${resetLink}">${resetLink}</a></p>`
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  console.log('mailer -> messageId:', info.messageId, 'previewUrl:', previewUrl);
  return { info, previewUrl };
}

module.exports = { transporter, sendResetEmail };
