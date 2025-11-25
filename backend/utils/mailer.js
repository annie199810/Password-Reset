
const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const FROM_EMAIL = process.env.FROM_EMAIL || '"Secure App" <no-reply@secureapp.com>';
const LOGO_URL = process.env.LOGO_URL || 'file:///mnt/data/pwe1.png'; 

async function sendViaSendGrid(toEmail, resetLink, htmlBody) {
  const key = process.env.SENDGRID_API_KEY;
  if (!key) throw new Error('No SENDGRID_API_KEY');
  sgMail.setApiKey(key);

  const msg = {
    to: toEmail,
    from: FROM_EMAIL,
    subject: 'Password reset',
    text: `Reset link: ${resetLink}`,
    html: htmlBody,
  };

  const res = await sgMail.send(msg);
  
  return { info: res, previewUrl: null };
}

async function sendViaSmtp(toEmail, resetLink, htmlBody) {
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
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'Password reset',
    text: `Reset link: ${resetLink}`,
    html: htmlBody
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  return { info, previewUrl };
}


function buildResetHtml({ resetLink, appName = 'Secure Account', logoUrl = LOGO_URL }) {
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${appName} — Reset Password</title>
    <style>
      body { font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, Arial; background:#f6f7fb; color:#0f1724; margin:0; padding:0; }
      .container { max-width:680px; margin:28px auto; background:#fff; border-radius:12px; padding:28px; box-shadow:0 10px 30px rgba(16,24,40,0.08); }
      .header { display:flex; align-items:center; gap:12px; }
      .logo { width:56px; height:56px; border-radius:10px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:linear-gradient(90deg,#7b61ff,#a78bfa); color:#fff; font-weight:700; }
      h1 { margin:0 0 8px 0; font-size:20px; }
      p { color:#475569; line-height:1.5; }
      .btn { display:inline-block; margin:18px 0; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:600; background:linear-gradient(90deg,#7b61ff,#a78bfa); color:#fff; }
      .note { font-size:13px; color:#94a3b8; margin-top:10px; }
      .footer { font-size:12px; color:#94a3b8; margin-top:18px; }
      .card { border:1px solid #eef2ff; border-radius:10px; padding:16px; background:#fbfbff; }
      /* mobile */
      @media (max-width:480px){
        .container { margin:14px; padding:18px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">
          <img src="${logoUrl}" alt="${appName} logo" style="width:100%; height:100%; object-fit:cover; border-radius:8px;" />
        </div>
        <div>
          <h1>${appName} — Password Reset</h1>
          <div class="note">A request was made to reset your password. Use the button below to set a new password. The link expires in 1 hour.</div>
        </div>
      </div>

      <div style="margin-top:18px" class="card">
        <p>Click the button below to reset your password:</p>
        <p style="text-align:center;">
          <a class="btn" href="${resetLink}">Reset password</a>
        </p>
        <p style="word-break:break-all; font-size:13px; color:#64748b">Or open this link in your browser:<br/>${resetLink}</p>
        <p class="note">If you didn't request this, you can ignore this email — the link will expire automatically.</p>
      </div>

      <div class="footer">© ${new Date().getFullYear()} — ${appName}. If you have problems, contact support.</div>
    </div>
  </body>
  </html>
  `;
}


async function sendResetEmail(toEmail, resetToken) {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(toEmail)}`;
  const htmlBody = buildResetHtml({ resetLink, appName: process.env.APP_NAME || 'Secure Account', logoUrl: process.env.LOGO_URL || LOGO_URL });

  
  if (process.env.SENDGRID_API_KEY) {
    try {
      return await sendViaSendGrid(toEmail, resetLink, htmlBody);
    } catch (err) {
      console.error('SendGrid send error:', err);
      
    }
  }

  try {
    return await sendViaSmtp(toEmail, resetLink, htmlBody);
  } catch (err) {
    console.error('SMTP send error:', err);
    throw err;
  }
}

module.exports = { sendResetEmail, buildResetHtml };
