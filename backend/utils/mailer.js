const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,
  port: Number(process.env.BREVO_PORT),
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});


transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP verify failed:", error);
  } else {
    console.log("✅ SMTP server is ready to send emails");
  }
});

async function sendResetEmail(toEmail, resetLink) {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM, 
      to: toEmail,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link is valid for 1 hour.</p>
      `,
    });

    console.log("📧 Email sent:", info.messageId);
    return true;
  } catch (err) {
    console.error("❌ Email send failed:", err);
    return false;
  }
}

module.exports = { sendResetEmail };
