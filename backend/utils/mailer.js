const sgMail = require("@sendgrid/mail");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY missing");
}

sgMail.setApiKey(SENDGRID_API_KEY);

async function sendResetEmail(toEmail, token) {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(
    toEmail
  )}`;

  const msg = {
    to: toEmail,
    from: FROM_EMAIL,
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset</h2>
      <p>You requested to reset your password.</p>
      <p>
        <a href="${resetLink}" target="_blank">
          Click here to reset your password
        </a>
      </p>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  await sgMail.send(msg);
  console.log("✅ Reset email sent to", toEmail);
}

module.exports = { sendResetEmail };
