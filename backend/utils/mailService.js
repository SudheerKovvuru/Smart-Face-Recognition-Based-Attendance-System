const nodemailer = require('nodemailer');

// ── Create email transporter ───────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
});

// ── Send email ─────────────────────────────────────────────────────────────
async function sendEmail(to, subject, message) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: to,
      subject: subject,
      html: `<h3>${subject}</h3><p>${message}</p>`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}`);
    return {
      success: true,
      message: `Email sent to ${to}`
    };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendEmail
};
