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

/*
 * Registration email used for Sprint 2 account verification.
 */
async function sendVerificationEmail(user, verificationUrl) {
  const transporter = createTransporter();

  const subject = "Verify your Cinema E-Booking account";

  const text = `Hello ${user.firstName},

Thank you for registering with Cinema E-Booking.

Please verify your account by opening this link:

${verificationUrl}

This verification link expires in 24 hours.

If you did not create this account, you can ignore this email.

Cinema E-Booking System`;

  if (!transporter) {
    console.log("=======================================");
    console.log("ACCOUNT VERIFICATION EMAIL PREVIEW");
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
  sendVerificationEmail,
};