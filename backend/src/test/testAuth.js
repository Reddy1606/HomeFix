/**
 * Automated Test Suite for HomeFix Backend 1
 * Kiểm thử toàn bộ luồng Auth, Validation, JWT và RBAC
 */
const http = require('http');
const app = require('../app');

const PORT = 5002;
const server = http.createServer(app);

server.listen(PORT, async () => {
  const baseUrl = `http://localhost:${PORT}`;
  console.log('\n==================================================');
  console.log('   🧪 BẮT ĐẦU KIỂM THỬ HOMEFIX BACKEND 1 API     ');
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
    // 1. Health check
    let res = await fetch(`${baseUrl}/api/health`);
    let data = await res.json();
    assert(res.status === 200 && data.success, 'GET /api/health - Healthcheck server');

    // 2. Login Admin mặc định
    res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@homefix.vn', password: 'Admin@123' }),
    });
    data = await res.json();
    const adminToken = data.data?.token;
    assert(res.status === 200 && adminToken && data.data?.user?.role === 'admin', 'POST /api/auth/login - Đăng nhập Admin thành công');

    // 3. Register Customer
    const rand = Math.floor(10000000 + Math.random() * 90000000);
    const testEmail = `khach_${rand}@homefix.test`;
    res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123',
        full_name: 'Nguyễn Văn Test',
        phone: `09${rand}`,
        role: 'customer',
        address: 'Vinhomes Grand Park, Q9',
      }),
    });
    data = await res.json();
    const customerToken = data.data?.token;
    assert(res.status === 201 && customerToken, 'POST /api/auth/register - Đăng ký Customer mới');

    // 4. Test Validation: Trùng email
    res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password@123',
        full_name: 'Trùng Email',
      }),
    });
    assert(res.status === 409, 'POST /api/auth/register - Chặn đăng ký trùng Email (HTTP 409)');

    // 5. GET /api/auth/me với Customer Token
    res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    data = await res.json();
    assert(res.status === 200 && data.data?.user?.email === testEmail, 'GET /api/auth/me - Lấy thông tin cá nhân qua JWT');

    // 6. RBAC: Customer gọi Admin Route (Chặn 403 Forbidden)
    res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(res.status === 403, 'RBAC Phân quyền - Chặn Customer truy cập Admin Route (HTTP 403 Forbidden)');

    // 7. RBAC: Admin gọi Admin Route (Cho phép 200 OK)
    res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    data = await res.json();
    assert(res.status === 200 && Array.isArray(data.data?.users), 'RBAC Phân quyền - Cho phép Admin xem danh sách Users (HTTP 200 OK)');

    console.log('\n--------------------------------------------------');
    console.log(`Kết quả: ${passed} Passed | ${failed} Failed`);
    console.log('==================================================\n');
  } catch (err) {
    console.error('Lỗi khi chạy kiểm thử:', err);
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
});
