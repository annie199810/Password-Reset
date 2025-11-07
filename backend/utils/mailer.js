const nodemailer = require('nodemailer');

async function createTransport() {
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
if (!EMAIL_USER) {

const testAccount = await nodemailer.createTestAccount();
return { transporter: nodemailer.createTransport({
host: 'smtp.ethereal.email',
port: 587,
auth: { user: testAccount.user, pass: testAccount.pass }
}), preview: nodemailer.getTestMessageUrl };
}


const nodemailer = require('nodemailer');

async function createTransporter() {

  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (host && user && pass) {

    return nodemailer.createTransport({
      host,
      port: port ? Number(port) : 587,
      secure: false,
      auth: { user, pass },
    });
  }


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
  try {
    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: `"Password Reset" <no-reply@example.com>`,
      to: toEmail,
      subject: 'Password reset — GUVI task',
      html: `Click <a href="${link}">here</a> to reset your password. The link expires in 1 hour.`,
    });

   
    const previewUrl = nodemailer.getTestMessageUrl(info) || null;
    console.log('Mailer: messageId=', info.messageId, 'previewUrl=', previewUrl);
    return { ok: true, previewUrl };
  } catch (err) {
    console.error('Mailer error:', err && (err.stack || err.message || err));
    throw err;
  }
}

module.exports = { sendResetEmail };

const transporter = nodemailer.createTransport({
host: EMAIL_HOST,
port: EMAIL_PORT,
secure: false,
auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});
return { transporter, preview: () => null };
}


async function sendResetEmail(to, link) {
const { transporter, preview } = await createTransport();
const info = await transporter.sendMail({
from: `Password Reset <${process.env.EMAIL_USER}>`,
to,
subject: 'Password reset - GUVI task',
html: `Click <a href="${link}">here</a> to reset your password. The link expires in 1 hour.`
});
return preview(info); 
}


module.exports = { sendResetEmail };