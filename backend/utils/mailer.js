
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');

async function sendViaSendGrid(toEmail, resetLink) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('No SENDGRID_API_KEY');
  sgMail.setApiKey(key);

  const msg = {
    to: toEmail,
    from: process.env.FROM_EMAIL || 'no-reply@secureapp.com',
    subject: 'Password reset',
    text: `Reset link: ${resetLink}`,
    html: `<p>Click to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
  };

  const res = await sgMail.send(msg);
  
  return { info: res, previewUrl: null };
}

async function sendViaSmtp(toEmail, resetLink) {
  const host = process.env.EMAIL_HOST || 'smtp.ethereal.email';
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';

  let transporter;
  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  } else {
    
    const testAcct = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAcct.user, pass: testAcct.pass }
    });
  }

  const mailOptions = {
    from: process.env.FROM_EMAIL || '"Secure App" <no-reply@secureapp.com>',
    to: toEmail,
    subject: 'Password reset',
    text: `Reset link: ${resetLink}`,
    html: `<p>Click to reset your password: <a href="${resetLink}">${resetLink}</a></p>`
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  return { info, previewUrl };
}

async function sendResetEmail(toEmail, resetToken) {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(toEmail)}`;

  
  if (process.env.SENDGRID_API_KEY) {
    try {
      return await sendViaSendGrid(toEmail, resetLink);
    } catch (err) {
      console.error('SendGrid send error:', err);
      
    }
  }

  try {
    return await sendViaSmtp(toEmail, resetLink);
  } catch (err) {
    console.error('SMTP send error:', err);
   
    throw err;
  }
}

module.exports = { sendResetEmail };
