const nodemailer = require('nodemailer');

async function createTransport() {
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;
if (!EMAIL_USER) {

const testAccount = await nodemailer.createTestAccount();
return { transporter: nodemailer.createTransport({
host: 'smtp.ethereal.email',
port: 587,
auth: { user: testAccount.user, pass: testAccount.pass }
}), preview: nodemailer.getTestMessageUrl };
}


const transporter = nodemailer.createTransport({
host: EMAIL_HOST,
port: EMAIL_PORT,
secure: false,
auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});
return { transporter, preview: () => null };
}


async function sendResetEmail(to, link) {
const { transporter, preview } = await createTransport();
const info = await transporter.sendMail({
from: `Password Reset <${process.env.EMAIL_USER}>`,
to,
subject: 'Password reset - GUVI task',
html: `Click <a href="${link}">here</a> to reset your password. The link expires in 1 hour.`
});
return preview(info); 
}


module.exports = { sendResetEmail };