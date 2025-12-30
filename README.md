🔐 Forgot Password & Reset Password – Implementation Overview

This project implements a complete Forgot Password & Reset Password flow using JWT authentication and SendGrid email service.

🔄 Flow Description

1.User enters their registered email address on the Forgot Password screen.

2.Backend generates a secure JWT reset token, valid for 1 hour.

3.A password reset link is created containing the token and email.

4.The reset link is sent to the user via SendGrid.

5.For evaluation and testing purposes, the generated reset link is also displayed on the UI.

6.User opens the reset link and enters a new password.

7.Backend verifies the token and allows the password reset.

📧 Email Delivery Note (Important)

Email sending is integrated using SendGrid.

SendGrid returns HTTP 202 (Accepted), confirming the email request was successfully processed by the service.

In free-tier / demo environments, email delivery may be delayed, filtered, or sent to spam.

👉 To ensure reviewers can fully test the feature, a Demo Reset Link is displayed on the UI after submitting the Forgot Password form.

This approach ensures:

✅ JWT token generation

✅ Secure reset link creation

✅ Reset password functionality

✅ End-to-end flow verification without email dependency

📸 Screenshots (Proof of Functionality)

Screenshots are provided in the screenshots/ folder for verification:

1️⃣ Forgot Password Screen

File: screenshots/forgot-password.png

Shows user entering email

Displays success message after reset request

Shows demo reset link for testing

2️⃣ Reset Password Screen

File: screenshots/reset-password.png

Accessed using reset token

Allows user to enter and submit a new password

3️⃣ Backend API Test (Postman)

File: screenshots/postman-request-reset.png

POST /api/auth/request-reset

Returns 200 OK

Confirms backend endpoint is working correctly

✅ Summary

This implementation successfully demonstrates:

Secure JWT-based password reset

Backend and frontend integration

Email service integration using SendGrid

Practical handling of demo environment limitations

📁 Folder Structure (Screenshots)
screenshots/
├── forgot-password.png
├── reset-password.png
└── postman-request-reset.png