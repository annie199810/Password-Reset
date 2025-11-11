
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 15000
});

async function sendResetEmail(to, token) {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;


  try {
  
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || '"Secure App" <no-reply@secureapp.com>',
      to,
      subject: 'Password Reset Request',
      text: `Open this link to reset your password: ${link}`,
      html: `<p>Open this link to reset your password: <a href="${link}">${link}</a></p>`
    });

    
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    console.log('✅ Email sent (info.messageId):', info && info.messageId);
    if (previewUrl) console.log('📬 Preview URL:', previewUrl);

    return { info, previewUrl, fallbackLink: null };
  } catch (err) {
   
    console.warn('mailer: SMTP send failed, using fallback link. Error:', (err && err.code) || err);
    console.log('FALLBACK RESET LINK (no SMTP):', link);
    return { info: null, previewUrl: null, fallbackLink: link };
  }
}

module.exports = { sendResetEmail };
