const nodemailer = require("nodemailer");

const FRONTEND_URL =
  (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");

async function sendResetEmail(email, token) {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("EMAIL_USER or EMAIL_PASS missing");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass
    }
  });

  const resetLink = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(email)}`;

  await transporter.sendMail({
    from: user,              // 👈 VERY IMPORTANT
    to: email,
    subject: "Password Reset Request",
    text: `Reset your password using this link: ${resetLink}`,
    html: `
      <h3>Password Reset</h3>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link is valid for 1 hour.</p>
    `
  });
}

module.exports = { sendResetEmail };
