
const nodemailer = require('nodemailer');

async function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : undefined;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;


  if (host && user && pass) {
    try {
      const secure = port === 465; 
      const transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        tls: {
          
          rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
        },
      });

    
      await transporter.verify();
      console.log('Mailer: using SMTP', host, 'port', port || 587);
      return { transporter, previewFn: () => null };
    } catch (err) {
      console.warn('Mailer: SMTP verify failed — falling back to Ethereal. Error:', err && err.message);
    }
  }


  const testAccount = await nodemailer.createTestAccount();
  const eth = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log('Mailer: using Ethereal test account:', testAccount.user);
  return { transporter: eth, previewFn: info => nodemailer.getTestMessageUrl(info) || null };
}

async function sendResetEmail(toEmail, link) {
  try {
    const { transporter, previewFn } = await createTransporter();

    const fromAddress = process.env.FROM_EMAIL || `Password Reset <no-reply@example.com>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: 'Password reset — GUVI task',
      html: `Click <a href="${link}">here</a> to reset your password. This link is valid for 1 hour.`,
    });

    const previewUrl = previewFn ? previewFn(info) : null;
    console.log('Mailer: messageId=', info.messageId, 'previewUrl=', previewUrl);
    return { ok: true, previewUrl };
  } catch (err) {
    console.error('Mailer error:', err && (err.stack || err.message || err));
    throw new Error('Failed to send email');
  }
}

module.exports = { sendResetEmail };
