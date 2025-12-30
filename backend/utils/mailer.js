console.log("✅ mailer.js loaded");

const sgMail = require("@sendgrid/mail");

if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY missing");
} else {
  console.log("🔑 SENDGRID_API_KEY found");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendResetEmail(toEmail, resetLink) {
  try {
    console.log("📨 Preparing email for:", toEmail);

    const msg = {
      to: toEmail,
      from: process.env.FROM_EMAIL, // must be verified in SendGrid
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link is valid for 1 hour.</p>
      `
    };

    const response = await sgMail.send(msg);
    console.log("📧 SendGrid response:", response[0].statusCode);

    return true;
  } catch (err) {
    console.error("❌ Email send failed:", err.response?.body || err);
    return false;
  }
}

module.exports = { sendResetEmail };
