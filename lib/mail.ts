import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(
  email: string,
  otp: string
) {
  await transporter.sendMail({
    from: `"Dhanusha-Coaching" <${process.env.EMAIL_USER}>`,

    to: email,

    subject: 'Verify your email',

    html: `
      <div style="
        max-width:600px;
        margin:auto;
        font-family:Arial,sans-serif;
        padding:24px;
      ">

        <h2>
          Verify your account
        </h2>

        <p>
          Use this OTP to complete registration:
        </p>

        <div
          style="
            font-size:32px;
            font-weight:700;
            letter-spacing:8px;
            padding:20px;
            text-align:center;
            background:#eef2ff;
            border-radius:12px;
            color:#4f46e5;
          "
        >
          ${otp}
        </div>

        <p style="margin-top:20px;">
          This code expires in
          <strong>10 minutes</strong>.
        </p>

        <p style="color:#666;">
          If you didn't request this,
          you can ignore this email.
        </p>

      </div>
    `,
  });
}