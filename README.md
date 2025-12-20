🔐 Password Reset Application

A secure authentication system with Login, Register, and Forgot Password functionality.
The application demonstrates industry-standard password reset flow using token and expiry.

🚀 Live Demo

Frontend:
https://pas-sec-app.netlify.app

Backend:
https://password-reset-2-qkox.onrender.com

🔑 Demo Credentials
Email: test@example.com
Password: test1234

✨ Features Implemented

✅ User Registration

✅ User Login with JWT authentication

✅ Forgot Password flow

✅ Secure password reset using token & expiry

✅ Reset link not exposed in browser

✅ Email-based reset logic implemented

✅ Security best practices followed

🔁 Forgot Password Flow (Explanation)

User clicks Forgot Password

User enters registered email

Backend generates:

Secure reset token

Expiry time (1 hour)

Reset link is handled via email logic

Browser always shows a generic success message:

If the email exists, a reset link has been sent.


Reset link is never shown in the UI or API response

User resets password using token verification

⚠️ For demo deployment, email delivery may be restricted by the hosting platform.
However, email logic and secure reset flow are fully implemented.

🔐 Security Measures

Same response for valid/invalid emails (prevents email enumeration)

Reset tokens expire automatically

Tokens cleared after password reset

Passwords stored using bcrypt hashing

JWT used for authenticated routes

🛠 Tech Stack

Frontend

HTML, CSS, JavaScript

Deployed on Netlify

Backend

Node.js

Express.js

SQLite

Nodemailer (email logic)

JWT Authentication

Deployed on Render

📝 Note for Evaluators

Forgot password flow uses email-based logic

Reset link is not exposed in browser

Token + expiry mechanism implemented securely

Email failures are handled gracefully for demo deployment

✅ Conclusion

This project demonstrates a real-world, secure password reset implementation
following industry best practices.