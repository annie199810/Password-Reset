const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendResetEmail(toEmail, token) {
  console.log("📨 SendGrid called for:", toEmail);

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${toEmail}`;

  const msg = {
    to: toEmail,
    from: process.env.FROM_EMAIL,
    subject: "Reset your password",
    html: `
      <h3>Password Reset</h3>
      <p>Click the link below:</p>
      <a href="${resetLink}">${resetLink}</a>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent successfully to:", toEmail);
  } catch (err) {
    console.error("❌ SendGrid ERROR:", err.response?.body || err.message);
    throw err;
  }
}

module.exports = { sendResetEmail };
