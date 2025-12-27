const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");

const FRONTEND_URL =
  (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

async function sendResetEmail(email, token) {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}&email=${email}`;

  // ✅ 1) TRY SENDGRID
  if (process.env.SENDGRID_API_KEY) {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      await sgMail.send({
        to: email,
        from: process.env.EMAIL_USER,
        subject: "Password Reset",
        html: `
          <h3>Password Reset</h3>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link is valid for 1 hour.</p>
        `
      });

      console.log("📧 Email sent via SendGrid");
      return;
    } catch (err) {
      console.error("❌ SendGrid failed:", err.message);
    }
  }

  // ✅ 2) FALLBACK — GMAIL SMTP
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      text: `Reset your password: ${resetLink}`,
      html: `<a href="${resetLink}">${resetLink}</a>`
    });

    console.log("📧 Email sent via Gmail SMTP");
  }
}

module.exports = { sendResetEmail };
