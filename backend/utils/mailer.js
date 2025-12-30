console.log("✅ mailer.js loaded");

const sgMail = require("@sendgrid/mail");

if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY missing");
} else {
  console.log("🔑 SENDGRID_API_KEY found");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendResetEmail(to, resetLink) {
  console.log("📨 Preparing email for:", to);
  console.log("🔗 Reset link:", resetLink);

  const msg = {
    to,
    from: process.env.FROM_EMAIL, // verified sender
    subject: "Password Reset Request",
    html: `
      <h3>Password Reset</h3>
      <p>Click below link to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>If you didn’t request this, ignore this mail.</p>
    `,
  };

  try {
    const response = await sgMail.send(msg);
    console.log("✅ Email sent successfully");
    console.log("📧 SendGrid response:", response[0].statusCode);
    return true;
  } catch (err) {
    console.error("❌ Email send failed");
    console.error(err.response?.body || err.message);
    return false;
  }
}

module.exports = { sendResetEmail };
