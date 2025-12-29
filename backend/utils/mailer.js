const sgMail = require("@sendgrid/mail");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY missing");
}

if (!FROM_EMAIL) {
  console.error("❌ FROM_EMAIL missing");
}

sgMail.setApiKey(SENDGRID_API_KEY);

async function sendResetEmail(to, token) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(
    to
  )}`;

  console.log("📨 Attempting to send email to:", to);
  console.log("🔗 Reset URL:", resetUrl);

  const msg = {
    to,
    from: FROM_EMAIL,
    subject: "Reset your password",
    html: `
      <h3>Password Reset</h3>
      <p>Click below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ EMAIL SENT SUCCESSFULLY");
  } catch (error) {
    console.error("❌ SENDGRID ERROR");
    console.error(error.response?.body || error.message);
    throw error;
  }
}

module.exports = { sendResetEmail };
