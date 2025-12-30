const sgMail = require("@sendgrid/mail");

console.log("✅ mailer.js loaded");

if (!process.env.SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY NOT FOUND");
} else {
  console.log("🔑 SENDGRID_API_KEY found");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendResetEmail(toEmail, token) {
  const resetLink = `${process.env.FRONTEND_URL}/reset?token=${token}&email=${toEmail}`;

  console.log("📧 Sending reset email to:", toEmail);
  console.log("🔗 Reset link:", resetLink);

  const msg = {
    to: toEmail,
    from: process.env.FROM_EMAIL, // must be verified in SendGrid
    subject: "Password Reset Request",
    html: `
      <h3>Password Reset</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 1 hour.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ SendGrid error:", error.response?.body || error.message);
    throw error;
  }
}

module.exports = { sendResetEmail };
