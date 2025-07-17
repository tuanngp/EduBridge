import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransporter({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send verification email
const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Xác thực tài khoản EduBridge',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Chào mừng đến với EduBridge!</h2>
        <p>Xin chào ${name},</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản EduBridge. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn bằng cách nhấp vào liên kết bên dưới:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Xác thực Email
          </a>
        </div>
        <p>Nếu bạn không thể nhấp vào nút trên, hãy sao chép và dán liên kết sau vào trình duyệt:</p>
        <p style="word-break: break-all; color: #6B7280;">${verificationUrl}</p>
        <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px;">
          Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.
        </p>
        <p style="color: #6B7280; font-size: 14px;">
          Trân trọng,<br>
          Đội ngũ EduBridge
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send notification email
const sendNotificationEmail = async (email, subject, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `EduBridge - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">EduBridge</h2>
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
          ${message}
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #E5E7EB;">
        <p style="color: #6B7280; font-size: 14px;">
          Trân trọng,<br>
          Đội ngũ EduBridge
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

export {
  sendVerificationEmail,
  sendNotificationEmail
};