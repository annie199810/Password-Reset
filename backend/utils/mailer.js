
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  
  connectionTimeout: 30_000
});

async function sendResetEmail(toEmail, resetToken) {
  
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(toEmail)}`;

  
  const mailOptions = {
    from: process.env.FROM_EMAIL || '"Your App" <no-reply@yourapp.com>',
    to: toEmail,
    subject: 'Password reset',
    text: `Reset link: ${resetLink}`,
    html: `<p>Click to reset: <a href="${resetLink}">${resetLink}</a></p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    
    const fallbackLink = resetLink;
    console.log('mailer -> messageId:', info.messageId, 'previewUrl:', previewUrl, 'fallback:', fallbackLink);
    return { info, previewUrl, fallbackLink };
  } catch (err) {
   
    console.error('sendMail error:', err);
    const fallbackLink = resetLink;
    return { info: null, previewUrl: null, fallbackLink, error: err.message || err.toString() };
  }
}

module.exports = { transporter, sendResetEmail };
