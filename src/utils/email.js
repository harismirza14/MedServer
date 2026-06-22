const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendTemporaryPassword(email, password, name) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || `"Med-Services-Doctor" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your Temporary Password',
    html: `
      <h3>Hello ${name},</h3>
      <p>Your account has been created. You can log in using the following temporary password:</p>
      <p><strong>${password}</strong></p>
      <p>Please change your password after logging in.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Temporary password email sent to ${email}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

module.exports = { sendTemporaryPassword };