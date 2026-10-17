/**
 * Automated Test Suite for HomeFix Backend 1 - Media Storage & Upload API
 */
const http = require('http');
const app = require('../app');

const PORT = 5003;
const server = http.createServer(app);

server.listen(PORT, async () => {
  const baseUrl = `http://localhost:${PORT}`;
  console.log('\n==================================================');
  console.log('   🧪 BẮT ĐẦU KIỂM THỬ HOMEFIX UPLOAD & STORAGE   ');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failed++;
    }
  };

  try {
    // 1. Đăng nhập Admin
    let res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@homefix.vn', password: 'Admin@123' }),
    });
    let data = await res.json();
    const adminToken = data.data?.token;

    // 2. Tạo tài khoản customer để test
    const rand = Math.floor(100000 + Math.random() * 900000);
    res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `cust_upload_${rand}@homefix.test`,
        password: 'Password@123',
        full_name: 'Khách Test Upload',
        phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: 'customer',
      }),
    });
    data = await res.json();
    const customerToken = data.data?.token;

    // 3. Tạo tài khoản thợ để test KYC
    res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `tech_upload_${rand}@homefix.test`,
        password: 'Password@123',
        full_name: 'Thợ Test Upload',
        phone: `09${Math.floor(10000000 + Math.random() * 90000000)}`,
        role: 'technician',
      }),
    });
    data = await res.json();
    const techToken = data.data?.token;

    // 4. Test upload avatar không có token (HTTP 401)
    res = await fetch(`${baseUrl}/api/upload/avatar`, { method: 'POST' });
    assert(res.status === 401, 'POST /api/upload/avatar - Chưa đăng nhập bị từ chối (HTTP 401)');

    // 5. Test upload avatar không đính kèm file (HTTP 400)
    const emptyForm = new FormData();
    res = await fetch(`${baseUrl}/api/upload/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: emptyForm,
    });
    data = await res.json();
    assert(res.status === 400, 'POST /api/upload/avatar - Thiếu tệp tin bị từ chối (HTTP 400)');

    // 6. Test upload avatar hợp lệ
    const fakeImage = new Blob(['fake-image-content-bytes-12345'], { type: 'image/png' });
    const avatarForm = new FormData();
    avatarForm.append('file', fakeImage, 'test-avatar.png');

    res = await fetch(`${baseUrl}/api/upload/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: avatarForm,
    });
    data = await res.json();
    assert(
      res.status === 200 && data.success && data.data?.avatar_url,
      'POST /api/upload/avatar - Cập nhật ảnh đại diện thành công'
    );

    // 7. Test Customer upload KYC (bị cấm - HTTP 403)
    const kycFormCust = new FormData();
    kycFormCust.append('file', fakeImage, 'cccd.png');
    kycFormCust.append('type', 'cccd');
    res = await fetch(`${baseUrl}/api/upload/kyc`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
      body: kycFormCust,
    });
    assert(res.status === 403, 'POST /api/upload/kyc - Customer không được upload KYC (HTTP 403)');

    // 8. Test Thợ upload KYC CCCD hợp lệ (HTTP 200)
    const kycFormTech = new FormData();
    kycFormTech.append('file', fakeImage, 'cccd.png');
    kycFormTech.append('type', 'cccd');
    kycFormTech.append('cccd_number', '079204001234');
    res = await fetch(`${baseUrl}/api/upload/kyc`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: kycFormTech,
    });
    data = await res.json();
    assert(
      res.status === 200 && data.success && data.data?.document_url && data.data?.user?.cccd_image,
      'POST /api/upload/kyc - Thợ upload ảnh CCCD xác minh thành công'
    );

    // 9. Test upload ảnh dịch vụ (Admin hợp lệ)
    const serviceForm = new FormData();
    serviceForm.append('file', fakeImage, 'service.png');
    res = await fetch(`${baseUrl}/api/upload/service-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: serviceForm,
    });
    data = await res.json();
    assert(
      res.status === 200 && data.success && data.data?.image_url,
      'POST /api/upload/service-image - Admin upload ảnh dịch vụ thành công'
    );

    console.log('\n--------------------------------------------------');
    console.log(`Kết quả: ${passed} Passed | ${failed} Failed`);
    console.log('==================================================\n');
  } catch (err) {
    console.error('Lỗi khi chạy kiểm thử:', err);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
});
