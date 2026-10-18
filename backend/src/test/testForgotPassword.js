/**
 * Test Suite: Forgot Password & OTP Flow
 * Chạy: node src/test/testForgotPassword.js
 */
const http = require('http');

const PORT = 5000;
const BASE_PATH = '/api/auth';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    };

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path: BASE_PATH + path,
        method,
        headers,
      },
      (res) => {
        let resBody = '';
        res.on('data', (chunk) => (resBody += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resBody) });
          } catch {
            resolve({ status: res.statusCode, raw: resBody });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

const TEST_EMAIL = 'customer_1791950269434@gmail.com';
const ORIGINAL_PASS = 'TestPassword123';
const NEW_PASS = 'NewSecretPass123';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n==================================================');
  console.log('   🧪 KIỂM THỬ TÍNH NĂNG QUÊN MẬT KHẨU & OTP      ');
  console.log('==================================================\n');

  try {
    // 1. Email sai định dạng
    const r1 = await request('POST', '/forgot-password', { email: 'invalid-email' });
    assert(r1.status === 400, 'POST /forgot-password - Email sai định dạng (HTTP 400)');

    // 2. Email không tồn tại
    const r2 = await request('POST', '/forgot-password', { email: 'unknown_not_in_db@gmail.com' });
    assert(r2.status === 404, 'POST /forgot-password - Email không tồn tại (HTTP 404)');

    // 3. Gửi OTP thành công cho email hợp lệ
    const r3 = await request('POST', '/forgot-password', { email: TEST_EMAIL });
    assert(r3.status === 200 && r3.data.success === true, 'POST /forgot-password - Gửi OTP thành công (HTTP 200)');
    const otp = r3.data.data?.devOtp;
    assert(Boolean(otp && otp.length === 6), 'Mã OTP trả về 6 chữ số hợp lệ');

    // 4. Rate-limit: Yêu cầu gửi lại ngay lập tức bị từ chối
    const r4 = await request('POST', '/forgot-password', { email: TEST_EMAIL });
    assert(r4.status === 429, 'POST /forgot-password - Rate-limit chặn gửi liên tục < 60s (HTTP 429)');

    // 5. Xác thực OTP sai
    const r5 = await request('POST', '/verify-otp', { email: TEST_EMAIL, otp: '000000' });
    assert(r5.status === 400, 'POST /verify-otp - OTP không chính xác (HTTP 400)');

    // 6. Xác thực OTP đúng
    const r6 = await request('POST', '/verify-otp', { email: TEST_EMAIL, otp });
    assert(r6.status === 200 && r6.data.success === true, 'POST /verify-otp - OTP chính xác (HTTP 200)');

    // 7. Đặt lại mật khẩu với mật khẩu mới quá yếu
    const r7 = await request('POST', '/reset-password', {
      email: TEST_EMAIL,
      otp,
      new_password: '123',
    });
    assert(r7.status === 400, 'POST /reset-password - Mật khẩu mới yếu bị từ chối (HTTP 400)');

    // 8. Đặt lại mật khẩu thành công
    const r8 = await request('POST', '/reset-password', {
      email: TEST_EMAIL,
      otp,
      new_password: NEW_PASS,
    });
    assert(r8.status === 200 && r8.data.success === true, 'POST /reset-password - Đổi mật khẩu thành công (HTTP 200)');

    // 9. Đăng nhập bằng mật khẩu cũ phải thất bại
    const r9 = await request('POST', '/login', {
      email: TEST_EMAIL,
      password: ORIGINAL_PASS,
    });
    assert(r9.status === 401, 'POST /login - Mật khẩu cũ không còn đăng nhập được (HTTP 401)');

    // 10. Đăng nhập bằng mật khẩu mới thành công
    const r10 = await request('POST', '/login', {
      email: TEST_EMAIL,
      password: NEW_PASS,
    });
    assert(r10.status === 200 && r10.data.data?.token, 'POST /login - Đăng nhập bằng mật khẩu mới thành công (HTTP 200)');

    // 11. Khôi phục lại mật khẩu ban đầu
    const User = require('../models/User');
    const { hashPassword } = require('../utils/helpers');
    const user = await User.findByEmail(TEST_EMAIL);
    if (user) {
      const origHash = await hashPassword(ORIGINAL_PASS);
      await User.updatePassword(user.id, origHash);
    }
    console.log('🔄 Đã khôi phục lại mật khẩu ban đầu cho tài khoản test.');
  } catch (error) {
    console.error('Lỗi khi chạy test:', error);
  }

  console.log('\n--------------------------------------------------');
  console.log(`Kết quả: ${passed} Passed | ${failed} Failed`);
  console.log('==================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
