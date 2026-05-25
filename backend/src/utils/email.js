const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Skip email if credentials are not configured
  if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    console.warn('[Email] Skipping: SMTP credentials not configured.');
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: `Smart Money <${process.env.EMAIL_USERNAME}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent to ${options.email}`);
  } catch (error) {
    console.error('[Email] Send failed (continuing):', error.message);
  }
};

module.exports = sendEmail;
