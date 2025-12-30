const sgMail = require("@sendgrid/mail");

console.log("✅ mailer.js loaded");

if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY is missing");
} else {
  console.log("🔑 SENDGRID_API_KEY found");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendResetEmail(toEmail, token) {
  console.log("📨 sendResetEmail called for:", toEmail);

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(
    toEmail
  )}`;

  console.log("🔗 Reset link generated:", resetLink);

  const msg = {
    to: toEmail,
    from: process.env.FROM_EMAIL,
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link is valid for 1 hour.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent successfully to:", toEmail);
  } catch (err) {
    console.error("❌ SendGrid error occurred");
    if (err.response) {
      console.error(JSON.stringify(err.response.body, null, 2));
    } else {
      console.error(err.message);
    }
    throw err;
  }
}

module.exports = { sendResetEmail };
