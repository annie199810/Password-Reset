
const nodemailer = require('nodemailer');

async function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  
  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port: port ? Number(port) : 587,
        secure: Number(port) === 465,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      
      await transporter.verify();
      console.log('Mailer: using provided SMTP server', host);
      return { transporter, previewFn: () => null };
    } catch (err) {
      console.warn('Mailer: failed to use provided SMTP (falling back).', err && err.message);
     
    }
  }

 
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    
    console.log('Mailer: using Ethereal test account:', testAccount.user);
    return { transporter, previewFn: info => nodemailer.getTestMessageUrl(info) || null };
  } catch (err) {
    console.warn('Mailer: Ethereal setup failed:', err && err.message);
    
  }

  
  return {
    transporter: {
      
      sendMail: async (opts) => {
        console.log('Mailer: no SMTP available, simulating sendMail. to=', opts.to);
        return { messageId: 'simulated-0001' };
      }
    },
    previewFn: () => null
  };
}


async function sendResetEmail(toEmail, link) {
  try {
    const { transporter, previewFn } = await createTransporter();

    const fromAddress = process.env.FROM_EMAIL || `"Password Reset" <no-reply@example.com>`;

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: 'Password reset — GUVI task',
        html: `Click <a href="${link}">here</a> to reset your password. The link expires in 1 hour.`,
      });

      const previewUrl = previewFn(info) || null;
      console.log('Mailer: messageId=', info && info.messageId, 'previewUrl=', previewUrl);
      return previewUrl;
    } catch (sendErr) {
     
      console.error('Mailer error: Failed to send mail (will return simulated preview).', sendErr && (sendErr.stack || sendErr.message || sendErr));
     
      const simulated = `https://preview.fake.email/?to=${encodeURIComponent(toEmail)}&link=${encodeURIComponent(link)}`;
      console.log('Mailer: returning simulated preview URL:', simulated);
      return simulated;
    }
  } catch (err) {
    
    console.error('sendResetEmail error (unexpected):', err && (err.stack || err));
    const fallback = `https://preview.fake.email/?to=${encodeURIComponent(toEmail)}&link=${encodeURIComponent(link)}`;
    return fallback;
  }
}

module.exports = { sendResetEmail };
