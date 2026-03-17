import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  // Debugging: This will show in your console if the variables are actually working
  console.log("Attempting to send email using:", process.env.EMAIL_USER);

  const transporter = nodemailer.createTransport({
    service: "gmail", // Using "service: gmail" is simpler for Gmail
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Survey Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};