const crypto = require('crypto');

/**
 * Service quản lý mã xác thực OTP dùng một lần cho HomeFix
 */
class OtpService {
  constructor() {
    /**
     * Map lưu OTP trong bộ nhớ: email -> { otp, expiresAt, createdAt, attempts, maxAttempts }
     */
    this.storage = new Map();

    // Dọn dẹp OTP hết hạn định kỳ mỗi 10 phút
    setInterval(() => {
      this.cleanupExpired();
    }, 10 * 60 * 1000).unref();
  }

  /**
   * Tạo mã OTP mới ngẫu nhiên 6 chữ số
   * @param {string} email
   * @param {number} expiresInMinutes - Thời hạn hiệu lực (mặc định 10 phút)
   * @returns {{ otp: string, expiresInMinutes: number } | { error: string, retryAfter: number }}
   */
  generateOtp(email, expiresInMinutes = 10) {
    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();
    const existing = this.storage.get(normalizedEmail);

    // Rate-limit: Chặn gửi lại nếu chưa qua 60 giây
    const COOLDOWN_SECONDS = 60;
    if (existing && now - existing.createdAt < COOLDOWN_SECONDS * 1000) {
      const waitSeconds = Math.ceil((COOLDOWN_SECONDS * 1000 - (now - existing.createdAt)) / 1000);
      return {
        error: 'RATE_LIMITED',
        retryAfter: waitSeconds,
        message: `Vui lòng đợi ${waitSeconds} giây trước khi yêu cầu gửi lại mã mới.`,
      };
    }

    // Tạo mã ngẫu nhiên 6 chữ số (100000 - 999999)
    const otp = crypto.randomInt(100000, 1000000).toString();

    this.storage.set(normalizedEmail, {
      otp,
      expiresAt: now + expiresInMinutes * 60 * 1000,
      createdAt: now,
      attempts: 0,
      maxAttempts: 5,
    });

    return {
      otp,
      expiresInMinutes,
    };
  }

  /**
   * Xác thực mã OTP
   * @param {string} email
   * @param {string} inputOtp
   * @param {boolean} consume - Có hủy mã ngay sau khi xác thực thành công hay không
   * @returns {{ valid: boolean, message?: string }}
   */
  verifyOtp(email, inputOtp, consume = false) {
    const normalizedEmail = email.toLowerCase().trim();
    const record = this.storage.get(normalizedEmail);

    if (!record) {
      return {
        valid: false,
        message: 'Mã xác thực không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.',
      };
    }

    // Kiểm tra hết hạn
    if (Date.now() > record.expiresAt) {
      this.storage.delete(normalizedEmail);
      return {
        valid: false,
        message: 'Mã xác thực OTP đã hết hạn. Vui lòng yêu cầu mã mới.',
      };
    }

    // Kiểm tra số lần thử sai
    if (record.attempts >= record.maxAttempts) {
      this.storage.delete(normalizedEmail);
      return {
        valid: false,
        message: 'Bạn đã nhập sai mã OTP quá 5 lần. Vì lý do an toàn, mã đã bị hủy. Vui lòng yêu cầu mã mới.',
      };
    }

    // So khớp mã
    if (record.otp !== inputOtp.toString().trim()) {
      record.attempts += 1;
      const remaining = record.maxAttempts - record.attempts;
      return {
        valid: false,
        message: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`,
      };
    }

    // Đúng mã
    if (consume) {
      this.storage.delete(normalizedEmail);
    }

    return { valid: true };
  }

  /**
   * Xóa mã OTP sau khi đổi mật khẩu xong
   */
  consumeOtp(email) {
    this.storage.delete(email.toLowerCase().trim());
  }

  /**
   * Dọn dẹp các mã OTP đã hết hạn
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [email, record] of this.storage.entries()) {
      if (now > record.expiresAt) {
        this.storage.delete(email);
      }
    }
  }
}

module.exports = new OtpService();
