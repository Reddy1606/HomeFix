const nodemailer = require('nodemailer');

/**
 * Service gửi email thông báo & OTP của HomeFix
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  /**
   * Khởi tạo nodemailer transporter dựa trên biến môi trường
   */
  initTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
      console.log(`📧 [EmailService] Đã cấu hình SMTP Transport (${host}:${port}) với tài khoản: ${user}`);
    } else {
      this.transporter = null;
    }
  }

  /**
   * Tạo mẫu HTML email thông báo mã OTP đặt lại mật khẩu
   */
  generateOtpEmailTemplate({ fullName, otp, expiresInMinutes = 10 }) {
    const formattedOtp = otp.toString().split('').join(' ');

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mã xác thực OTP đặt lại mật khẩu</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
      color: #1e293b;
    }
    .email-container {
      max-width: 540px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .logo-badge {
      display: inline-flex;
      width: 48px;
      height: 48px;
      background: #ffffff;
      color: #1d4ed8;
      font-weight: 900;
      font-size: 24px;
      line-height: 48px;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
      margin-bottom: 12px;
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .description {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .otp-box {
      background: #eff6ff;
      border: 2px dashed #3b82f6;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #1d4ed8;
      margin-bottom: 8px;
    }
    .otp-code {
      font-family: 'Courier New', Courier, monospace;
      font-size: 36px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 6px;
      margin: 4px 0;
    }
    .otp-expiry {
      font-size: 13px;
      color: #dc2626;
      font-weight: 600;
      margin-top: 8px;
    }
    .warning-box {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 6px;
      font-size: 13px;
      color: #92400e;
      margin-top: 24px;
      line-height: 1.5;
    }
    .footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo-badge">H</div>
      <h1>HomeFix · Dịch vụ Sửa chữa Tại nhà</h1>
    </div>
    <div class="content">
      <div class="greeting">Xin chào ${fullName || 'Quý khách'},</div>
      <div class="description">
        Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản HomeFix của bạn. Vui lòng nhập mã xác thực OTP dưới đây để hoàn tất việc thiết lập mật khẩu mới:
      </div>

      <div class="otp-box">
        <div class="otp-label">MÃ XÁC THỰC CỦA BẠN</div>
        <div class="otp-code">${formattedOtp}</div>
        <div class="otp-expiry">⏳ Mã có hiệu lực trong vòng ${expiresInMinutes} phút</div>
      </div>

      <div class="warning-box">
        ⚠️ <strong>Lưu ý bảo mật:</strong> Không chia sẻ mã OTP này cho bất kỳ ai, kể cả nhân viên HomeFix. Nếu bạn không gửi yêu cầu này, hãy bỏ qua email hoặc đổi mật khẩu tài khoản ngay để bảo vệ thông tin.
      </div>
    </div>
    <div class="footer">
      Email này được gửi tự động từ hệ thống nền tảng <strong>HomeFix (EXE101)</strong>.<br>
      © ${new Date().getFullYear()} HomeFix. Bảo lưu mọi quyền.
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Gửi email OTP
   * @param {Object} params - { to, fullName, otp, expiresInMinutes }
   * @returns {Promise<{ success: boolean, previewUrl?: string }>}
   */
  async sendOtpEmail({ to, fullName, otp, expiresInMinutes = 10 }) {
    const subject = `[HomeFix] Mã xác thực OTP đặt lại mật khẩu: ${otp}`;
    const html = this.generateOtpEmailTemplate({ fullName, otp, expiresInMinutes });
    const text = `Xin chào ${fullName || 'bạn'},\nMã xác thực OTP đặt lại mật khẩu HomeFix của bạn là: ${otp}. Mã có hiệu lực trong ${expiresInMinutes} phút.\nKhông chia sẻ mã này cho bất kỳ ai.`;

    // Luôn ghi log rõ ràng trong terminal
    console.log('\n======================================================================');
    console.log('📨 [HOMEFIX EMAIL NOTIFICATION - OTP RESET PASSWORD]');
    console.log(`➡️  Gửi đến: ${to} (${fullName || 'Khách hàng'})`);
    console.log(`🔑 MÃ OTP:  ${otp}`);
    console.log(`⏳ Hết hạn: ${expiresInMinutes} phút`);
    console.log('======================================================================\n');

    const fromAddress = process.env.EMAIL_FROM || '"HomeFix Vietnam" <no-reply@homefix.vn>';

    // Nếu đã cấu hình SMTP thực tế
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to,
          subject,
          text,
          html,
        });
        console.log(`✅ [EmailService] Gửi email thành công qua SMTP! MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error('❌ [EmailService] Gửi qua SMTP thất bại:', error.message);
        // Fallback: không ném lỗi làm sập flow, vẫn trả về thành công vì mã đã log ở terminal
        return { success: true, warning: 'SMTP failed, OTP logged to console' };
      }
    }

    // Nếu chưa cấu hình SMTP, thử tạo Ethereal test account (dev test)
    try {
      const testAccount = await nodemailer.createTestAccount();
      const testTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await testTransporter.sendMail({
        from: fromAddress,
        to,
        subject,
        text,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 [EmailService Preview URL] Xem trực tiếp giao diện email tại: ${previewUrl}`);
      }
      return { success: true, previewUrl };
    } catch {
      // Khi không có kết nối internet ra ngoài ethereal, vẫn trả success vì đã log OTP ra console
      return { success: true };
    }
  }
}

module.exports = new EmailService();
