const nodemailer = require('nodemailer');

/**
 * Reusable transporter instance for better performance in production.
 * Note: For Gmail, ensure you use an "App Password" if 2FA is enabled.
 */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Utility to send emails using Nodemailer and Gmail
 */
const sendEmail = async (options) => {
  // Verify credentials exist before attempting to send
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('X Email Error: EMAIL_USER or EMAIL_PASS environment variables are missing.');
    throw new Error('Email configuration missing');
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Smart Money" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;