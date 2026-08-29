import dotenv from "dotenv";

dotenv.config();

import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOTP = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL,

    to: email,

    subject: "Perfumo OTP Verification",

    html: `
            <h2>Your OTP Code</h2>
            <h1>${otp}</h1>
            <p>This OTP expires in 1 minute.</p>
        `,
  });
};
