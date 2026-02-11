// utils/mailer.js
const fetch = require("node-fetch"); // if Node < 18

async function sendResetEmail(toEmail, resetLink) {
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Password Reset App",
          email: process.env.MAIL_FROM,
        },
        to: [{ email: toEmail }],
        subject: "Password Reset Request",
        htmlContent: `
          <h2>Password Reset</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link is valid for 15 minutes.</p>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ Brevo API error:", errText);
      return false;
    }

    console.log("📧 Email sent via Brevo API");
    return true;
  } catch (error) {
    console.error("❌ Brevo API request failed:", error);
    return false;
  }
}

module.exports = { sendResetEmail };
