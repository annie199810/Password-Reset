const sgMail = require("@sendgrid/mail");

// ENV check (important)
if (!process.env.SENDGRID_API_KEY) {
  console.warn("⚠️ SENDGRID_API_KEY not set");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL =
  process.env.FROM_EMAIL || "developerannie057@gmail.com";
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Send password reset email
 * @param {string} toEmail
 * @param {string} token
 */
async function sendResetEmail(toEmail, token) {
  const resetLink = `${FRONTEND_URL}/reset?token=${token}&email=${encodeURIComponent(
    toEmail
  )}`;

  const msg = {
    to: toEmail,
    from: {
      email: FROM_EMAIL,
      name: "Secure App"
    },
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6">
        <h2>Password Reset</h2>
        <p>You requested to reset your password.</p>
        <p>
          <a href="${resetLink}"
             style="
               display:inline-block;
               padding:10px 18px;
               background:#6c5ce7;
               color:#ffffff;
               text-decoration:none;
               border-radius:4px;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in <b>1 hour</b>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr />
        <small>Secure App • Password Reset System</small>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Reset email sent to:", toEmail);
  } catch (err) {
    console.error("❌ SendGrid error:");
    console.error(err.response?.body || err.message);
    throw err;
  }
}

module.exports = { sendResetEmail };
