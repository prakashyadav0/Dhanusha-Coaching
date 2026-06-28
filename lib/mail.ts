import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string) {
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
        <h2>Verify your account</h2>

        <p>Use this OTP to complete registration:</p>

        <div style="
          font-size:32px;
          font-weight:700;
          letter-spacing:8px;
          padding:20px;
          text-align:center;
          background:#eef2ff;
          border-radius:12px;
          color:#4f46e5;
        ">
          ${otp}
        </div>

        <p style="margin-top:20px;">
          This code expires in <strong>10 minutes</strong>.
        </p>

        <p style="color:#666;">
          If you didn't request this, you can ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
) {
  await transporter.sendMail({
    from: `"Dhanusha-Coaching" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your password',
    html: `
      <div style="
        max-width:600px;
        margin:auto;
        font-family:Arial,sans-serif;
        padding:24px;
      ">
        <h2>Reset your password</h2>

        <p>Hi ${name},</p>

        <p>
          We received a request to reset your password.
          Click the button below — this link expires in <strong>1 hour</strong>.
        </p>

        <div style="text-align:center; margin:32px 0;">
          <a
            href="${resetUrl}"
            style="
              display:inline-block;
              padding:14px 32px;
              background:#4f46e5;
              color:#fff;
              text-decoration:none;
              border-radius:8px;
              font-weight:700;
              font-size:15px;
            "
          >
            Reset password
          </a>
        </div>

        <p style="color:#666; font-size:13px;">
          Or copy this link into your browser:<br />
          <span style="color:#4f46e5;">${resetUrl}</span>
        </p>

        <p style="color:#666;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}