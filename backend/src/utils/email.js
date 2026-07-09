const nodemailer = require('nodemailer');

/**
 * Utility to send emails using Nodemailer and Gmail
 */
const sendEmail = async (options) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.error('❌ EMAIL CONFIG ERROR: EMAIL_USER or EMAIL_PASS is not defined in your .env file.');
    console.log('DEBUG - Code intended for:', options.email, 'is:', options.subject);
    return; // Stop execution if config is missing
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass, // Must be a 16-character App Password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Smart Money" <${emailUser}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
  } catch (error) {
    console.error('❌ NODEMAILER ERROR:', error.message);
    throw error;
  }
};

module.exports = sendEmail;