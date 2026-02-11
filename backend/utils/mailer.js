// backend/utils/mailer.js

// If Render is using Node 18+, fetch is global.
// If not, install node-fetch: npm install node-fetch
let fetchFn;
try {
  fetchFn = fetch; // Node 18+
} catch {
  fetchFn = require("node-fetch"); // Node < 18
}

async function sendResetEmail(toEmail, resetLink) {
  try {
    const res = await fetchFn("https://api.brevo.com/v3/smtp/email", {
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

    const text = await res.text();

    if (!res.ok) {
      console.error("❌ Brevo API error:", text);
      return false;
    }

    console.log("📧 Email sent via Brevo API:", text);
    return true;
  } catch (error) {
    console.error("❌ Brevo API request failed:", error);
    return false;
  }
}

module.exports = { sendResetEmail };
