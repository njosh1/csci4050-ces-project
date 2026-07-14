const nodemailer = require("nodemailer");

function createTransporter() {
  /*
   * During development, the application can still run without SMTP.
   * In that case, the email is printed to the backend terminal.
   */
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendProfileChangedEmail(user, changedFields) {
  const transporter = createTransporter();

  const subject = "Your Cinema E-Booking profile was updated";

  const text = `Hello ${user.firstName},

Your Cinema E-Booking profile was updated.

Changed information:
${changedFields.join(", ")}

If you did not make this change, please contact support immediately.

Cinema E-Booking System`;


  if (!transporter) {
    console.log("=======================================");
    console.log("PROFILE EMAIL NOTIFICATION PREVIEW");
    console.log(`To: ${user.email}`);
    console.log(`Subject: ${subject}`);
    console.log(text);
    console.log("=======================================");

    return {
      preview: true,
    };
  }

  await transporter.sendMail({
    from:
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER,

    to: user.email,
    subject,
    text,
  });

  return {
    preview: false,
  };
}

module.exports = {
  sendProfileChangedEmail,
};