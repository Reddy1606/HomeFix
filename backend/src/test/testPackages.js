/**
 * Test Suite: Gói dịch vụ & Thuê bao bảo dưỡng định kỳ (HomeFix EXE101)
 */
const http = require('http');
const app = require('../app');
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Subscription = require('../models/Subscription');
const { generateToken } = require('../utils/helpers');

let server;
let port;
let baseUrl;

function request(method, path, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers },
    };

    let payload;
    if (body) {
      payload = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(rawData);
        } catch (e) {
          json = rawData;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

let customerUser;
let customerToken;
let technicianUser;
let technicianToken;
let adminUser;
let adminToken;
let testService;
let createdBookingId;

async function runTests() {
  console.log('\n==================================================');
  console.log('   🧪 KIỂM THỬ TÍNH NĂNG GÓI DỊCH VỤ & THUÊ BAO   ');
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
    // Khởi tạo test server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Setup accounts
    customerUser = await User.findByEmail('khanglvse182864@fpt.edu.vn') || await User.findByEmail('khach1@homefix.vn');
    if (!customerUser) {
      const all = await User.findAll({ limit: 5 });
      customerUser = all.users.find(u => u.role === 'customer');
    }
    customerToken = generateToken({ id: customerUser.id, role: customerUser.role });

    technicianUser = await User.findByEmail('hoangtest@gmail.com') || await User.findByEmail('tho1@homefix.vn');
    if (!technicianUser) {
      const all = await User.findAll({ limit: 5 });
      technicianUser = all.users.find(u => u.role === 'technician');
    }
    if (technicianUser && !technicianUser.is_verified) {
      await User.update(technicianUser.id, { is_verified: true });
      technicianUser.is_verified = true;
    }
    technicianToken = generateToken({ id: technicianUser.id, role: technicianUser.role });

    adminUser = await User.findByEmail('admin@homefix.vn');
    adminToken = generateToken({ id: adminUser.id, role: adminUser.role });

    const services = await Service.findAll({ limit: 1 });
    testService = services.services[0];

    // TEST 1: Lấy danh sách gói public
    const res1 = await request('GET', '/api/packages');
    assert(res1.status === 200 && Array.isArray(res1.data.data.packages) && res1.data.data.packages.length >= 3, 'GET /api/packages - Lấy danh sách gói dịch vụ công khai thành công (>= 3 gói)');

    // TEST 2: Customer kiểm tra gói chưa mua
    const res2 = await request('GET', '/api/packages/my-subscription', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(res2.status === 200, 'GET /api/packages/my-subscription - Khách hàng kiểm tra trạng thái gói thành công');

    // TEST 3: Customer đăng ký gói VIP Standard 1 năm
    const standardPkg = res1.data.data.packages.find(p => p.code === 'standard_1y') || res1.data.data.packages[0];
    const res3 = await request('POST', '/api/packages/subscribe', {
      headers: { Authorization: `Bearer ${customerToken}` },
      body: { package_id: standardPkg.id, payment_method: 'bank_transfer' },
    });
    assert(res3.status === 201 && res3.data.data.subscription.status === 'active', 'POST /api/packages/subscribe - Đăng ký gói bảo dưỡng 1 năm thành công');

    // TEST 4: Khách đặt lịch và dùng 1 lượt bảo dưỡng định kỳ
    const res4 = await request('POST', '/api/bookings', {
      headers: { Authorization: `Bearer ${customerToken}` },
      body: {
        service_id: testService.id,
        booking_type: 'immediate',
        address: '123 Đường Test VIP, Quận 1, TP.HCM',
        description: 'Vệ sinh máy lạnh định kỳ',
        use_maintenance_quota: true,
      },
    });
    assert(res4.status === 201 && res4.data.data.booking.total_price === 0 && res4.data.data.booking.is_priority === true, 'POST /api/bookings - Áp dụng miễn phí 1 lượt bảo dưỡng (total_price = 0) và gắn cờ Ưu tiên VIP');
    createdBookingId = res4.data.data.booking.id;

    // TEST 5: Thợ xem danh sách việc mới -> Thấy đơn VIP ở đầu danh sách
    const res5 = await request('GET', '/api/technician/jobs/available', {
      headers: { Authorization: `Bearer ${technicianToken}` },
    });
    if (!res5.data?.data?.bookings?.some(b => b.id === createdBookingId)) {
      console.log('DEBUG res5:', JSON.stringify(res5.data, null, 2));
    }
    const foundJob = res5.data?.data?.bookings?.find(b => b.id === createdBookingId);
    assert(res5.status === 200 && foundJob && foundJob.is_priority === true, 'GET /api/technician/jobs/available - Thợ thấy đơn VIP được ưu tiên trong danh sách việc');

    // TEST 6: Admin xem danh sách thuê bao & doanh thu gói
    const res6 = await request('GET', '/api/packages/admin/subscriptions', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res6.status === 200 && res6.data.data.stats.total_subscriptions >= 1, 'GET /api/packages/admin/subscriptions - Admin xem danh sách thuê bao & thống kê MRR');

    // TEST 7: Admin Dashboard chứa số liệu subscription
    const res7 = await request('GET', '/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(res7.status === 200 && res7.data.data.subscription_stats != null, 'GET /api/admin/dashboard - Dashboard tích hợp thống kê thuê bao subscription');

    // TEST 8: Khách hàng hủy gói dịch vụ
    const res8 = await request('POST', '/api/packages/cancel', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(res8.status === 200 && res8.data.data.subscription.status === 'cancelled', 'POST /api/packages/cancel - Khách hàng hủy gói dịch vụ thành công');

  } catch (err) {
    console.error('Lỗi khi chạy test gói dịch vụ:', err);
    failed++;
  } finally {
    if (createdBookingId) {
      try {
        const { supabase } = require('../config/database');
        await supabase.from('bookings').delete().eq('id', createdBookingId);
      } catch (e) {}
    }
    if (server) {
      server.close();
    }
    console.log('\n--------------------------------------------------');
    console.log(`Kết quả: ${passed} Passed | ${failed} Failed`);
    console.log('==================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
