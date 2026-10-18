/**
 * Automated Test Suite for HomeFix Backend 2
 * Kiểm thử API Dịch vụ, Đặt lịch, Admin quản trị dịch vụ & đơn
 *
 * Lưu ý: test chạy trên database thật (Supabase) nên sẽ để lại dữ liệu test:
 *  - vài tài khoản "*@homefix.test"
 *  - đơn đặt lịch của các tài khoản đó
 *  - 1 dịch vụ "[TEST] ..." (đã được ẩn ở cuối bài test)
 */
const http = require('http');
const app = require('../app');

const PORT = 5003;
const server = http.createServer(app);

server.listen(PORT, async () => {
  const baseUrl = `http://localhost:${PORT}`;
  console.log('\n==================================================');
  console.log('   🧪 BẮT ĐẦU KIỂM THỬ HOMEFIX BACKEND 2 API     ');
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

  // Gọi API và trả về { status, body }
  const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try {
      json = await res.json();
    } catch (e) {
      json = null;
    }
    return { status: res.status, body: json };
  };

  const randomPhone = () => `09${Math.floor(10000000 + Math.random() * 90000000)}`;
  const registerUser = async (role, label) => {
    const rand = Math.floor(10000000 + Math.random() * 90000000);
    const email = `${label}_${rand}@homefix.test`;
    const r = await call('POST', '/api/auth/register', {
      body: { email, password: 'Password@123', full_name: `Test ${label}`, phone: randomPhone(), role },
    });
    return { id: r.body?.data?.user?.id, token: r.body?.data?.token };
  };

  // Thời điểm hẹn: ngày mai, theo chuẩn ISO có múi giờ
  const tomorrowIso = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const FAKE_UUID = '00000000-0000-4000-8000-000000000000';

  try {
    // ==================== CHUẨN BỊ TÀI KHOẢN ====================
    let r = await call('POST', '/api/auth/login', {
      body: { email: 'admin@homefix.vn', password: 'Admin@123' },
    });
    const adminToken = r.body?.data?.token;
    const customer = await registerUser('customer', 'khach');
    const customer2 = await registerUser('customer', 'khach2');
    const techVerified = await registerUser('technician', 'tho');
    const techUnverified = await registerUser('technician', 'thochuaxm');
    assert(adminToken && customer.token && customer2.token && techVerified.id && techUnverified.id,
      'Chuẩn bị: đăng nhập admin, tạo 2 customer + 2 thợ');

    // Thợ nộp hồ sơ KYC trước khi được admin duyệt
    await call('PUT', '/api/auth/me', {
      token: techVerified.token,
      body: { cccd_number: '079203001234' },
    });

    // Admin xác minh 1 thợ (API của Backend 1)
    r = await call('PUT', `/api/admin/users/${techVerified.id}/verify`, { token: adminToken, body: { verified: true } });
    assert(r.status === 200, 'Chuẩn bị: admin xác minh thợ (PUT /api/admin/users/:id/verify)');

    // Admin thử xác minh thợ chưa nộp hồ sơ -> phải bị từ chối 400
    const failVerify = await call('PUT', `/api/admin/users/${techUnverified.id}/verify`, { token: adminToken, body: { verified: true } });
    assert(failVerify.status === 400, 'Admin không thể duyệt thợ chưa nộp hồ sơ KYC (HTTP 400)');

    // ==================== 1. SERVICES (PUBLIC) ====================
    r = await call('GET', '/api/services');
    const services = r.body?.data?.services || [];
    assert(r.status === 200 && services.length > 0 && r.body.data.pagination?.total >= services.length,
      'GET /api/services - Lấy danh sách dịch vụ kèm phân trang (không cần đăng nhập)');
    assert(services.every((s) => s.is_active === true), 'GET /api/services - Chỉ trả dịch vụ đang hoạt động');

    const firstService = services[0];

    r = await call('GET', '/api/services/categories');
    const categories = r.body?.data?.categories || [];
    assert(r.status === 200 && categories.length > 0 && categories[0].category && categories[0].total > 0,
      'GET /api/services/categories - Lấy danh mục dịch vụ');

    r = await call('GET', `/api/services?category=${encodeURIComponent(firstService.category)}`);
    assert(r.status === 200 && r.body.data.services.length > 0 &&
      r.body.data.services.every((s) => s.category === firstService.category),
    'GET /api/services?category= - Lọc theo danh mục');

    r = await call('GET', `/api/services?search=${encodeURIComponent(firstService.name)}`);
    assert(r.status === 200 && r.body.data.services.some((s) => s.id === firstService.id),
      'GET /api/services?search= - Tìm kiếm theo tên dịch vụ');

    r = await call('GET', '/api/services?sort=price_desc&limit=100');
    const prices = (r.body?.data?.services || []).map((s) => Number(s.base_price));
    assert(r.status === 200 && prices.every((p, i) => i === 0 || prices[i - 1] >= p),
      'GET /api/services?sort=price_desc - Sắp xếp giá giảm dần');

    r = await call('GET', '/api/services?min_price=500000&max_price=100000');
    assert(r.status === 400 && r.body.success === false, 'GET /api/services - min_price > max_price bị từ chối (HTTP 400)');

    r = await call('GET', '/api/services?limit=9999');
    assert(r.status === 400, 'GET /api/services?limit=9999 - Chặn limit vượt mức cho phép (HTTP 400)');

    r = await call('GET', `/api/services/${firstService.id}`);
    assert(r.status === 200 && r.body.data?.service?.id === firstService.id,
      'GET /api/services/:id - Xem chi tiết dịch vụ');

    r = await call('GET', `/api/services/${FAKE_UUID}`);
    assert(r.status === 404, 'GET /api/services/:id - ID không tồn tại (HTTP 404)');

    r = await call('GET', '/api/services/khong-phai-uuid');
    assert(r.status === 400, 'GET /api/services/:id - ID sai định dạng (HTTP 400)');

    // ==================== 2. BOOKINGS - TẠO ĐƠN ====================
    const validBooking = {
      service_id: firstService.id,
      booking_type: 'immediate',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      description: 'Máy lạnh chảy nước, không mát',
    };

    r = await call('POST', '/api/bookings', { body: validBooking });
    assert(r.status === 401, 'POST /api/bookings - Chưa đăng nhập (HTTP 401)');

    r = await call('POST', '/api/bookings', { token: adminToken, body: validBooking });
    assert(r.status === 403, 'POST /api/bookings - Admin không được đặt lịch (HTTP 403)');

    r = await call('POST', '/api/bookings', { token: customer.token, body: { service_id: firstService.id } });
    assert(r.status === 400 && r.body.errors?.some((e) => e.field === 'address'),
      'POST /api/bookings - Thiếu địa chỉ (HTTP 400, có errors[].field)');

    r = await call('POST', '/api/bookings', {
      token: customer.token,
      body: { ...validBooking, booking_type: 'scheduled' },
    });
    assert(r.status === 400 && r.body.errors?.some((e) => e.field === 'scheduled_at'),
      'POST /api/bookings - Đơn hẹn giờ thiếu scheduled_at (HTTP 400)');

    r = await call('POST', '/api/bookings', {
      token: customer.token,
      body: { ...validBooking, booking_type: 'scheduled', scheduled_at: '2020-01-01T09:00:00Z' },
    });
    assert(r.status === 400, 'POST /api/bookings - Hẹn giờ trong quá khứ (HTTP 400)');

    r = await call('POST', '/api/bookings', {
      token: customer.token,
      body: { ...validBooking, booking_type: 'scheduled', scheduled_at: '2099-01-01T09:00:00' },
    });
    assert(r.status === 400, 'POST /api/bookings - scheduled_at thiếu múi giờ bị từ chối (HTTP 400)');

    r = await call('POST', '/api/bookings', {
      token: customer.token,
      body: { ...validBooking, service_id: FAKE_UUID },
    });
    assert(r.status === 404, 'POST /api/bookings - Dịch vụ không tồn tại (HTTP 404)');

    // Gửi kèm total_price / status giả: server phải bỏ qua
    r = await call('POST', '/api/bookings', {
      token: customer.token,
      body: { ...validBooking, total_price: 1, status: 'completed', customer_id: FAKE_UUID },
    });
    const booking = r.body?.data?.booking;
    assert(r.status === 201 && booking?.status === 'pending' &&
      Number(booking.total_price) === Number(firstService.base_price) &&
      booking.customer_id === (await call('GET', '/api/auth/me', { token: customer.token })).body.data.user.id,
    'POST /api/bookings - Tạo đơn tức thì thành công; giá/trạng thái/chủ đơn do server quyết định');
    assert(booking?.can_cancel === true && booking?.services?.name === firstService.name,
      'POST /api/bookings - Response có can_cancel và thông tin dịch vụ');

    r = await call('POST', '/api/bookings', {
      token: customer.token,
      body: { ...validBooking, booking_type: 'scheduled', scheduled_at: tomorrowIso() },
    });
    const scheduledBooking = r.body?.data?.booking;
    assert(r.status === 201 && scheduledBooking?.booking_type === 'scheduled' && scheduledBooking?.scheduled_at,
      'POST /api/bookings - Tạo đơn hẹn giờ thành công');

    // ==================== 3. BOOKINGS - LỊCH SỬ & CHI TIẾT ====================
    r = await call('GET', '/api/bookings/my', { token: customer.token });
    assert(r.status === 200 && r.body.data.bookings.length >= 2 &&
      r.body.data.bookings.some((b) => b.id === booking.id) && r.body.data.pagination?.total >= 2,
    'GET /api/bookings/my - Xem lịch sử đặt lịch');

    r = await call('GET', '/api/bookings/my?status=pending', { token: customer.token });
    assert(r.status === 200 && r.body.data.bookings.every((b) => b.status === 'pending'),
      'GET /api/bookings/my?status=pending - Lọc theo trạng thái');

    r = await call('GET', '/api/bookings/my?status=abc', { token: customer.token });
    assert(r.status === 400, 'GET /api/bookings/my?status=abc - Trạng thái không hợp lệ (HTTP 400)');

    r = await call('GET', '/api/bookings/my', { token: customer2.token });
    assert(r.status === 200 && r.body.data.bookings.length === 0,
      'GET /api/bookings/my - Customer khác không thấy đơn của người khác');

    r = await call('GET', `/api/bookings/${booking.id}`, { token: customer.token });
    assert(r.status === 200 && r.body.data.booking.id === booking.id, 'GET /api/bookings/:id - Chủ đơn xem chi tiết');

    r = await call('GET', `/api/bookings/${booking.id}`, { token: customer2.token });
    assert(r.status === 404, 'GET /api/bookings/:id - Người khác xem đơn không phải của mình (HTTP 404)');

    r = await call('GET', `/api/bookings/${booking.id}`, { token: adminToken });
    assert(r.status === 200, 'GET /api/bookings/:id - Admin xem được mọi đơn');

    r = await call('GET', `/api/bookings/${FAKE_UUID}`, { token: customer.token });
    assert(r.status === 404, 'GET /api/bookings/:id - Đơn không tồn tại (HTTP 404)');

    // ==================== 4. BOOKINGS - KHÁCH HỦY ĐƠN ====================
    r = await call('PUT', `/api/bookings/${scheduledBooking.id}/cancel`, { token: customer2.token });
    assert(r.status === 404, 'PUT /api/bookings/:id/cancel - Không hủy được đơn của người khác (HTTP 404)');

    r = await call('PUT', `/api/bookings/${scheduledBooking.id}/cancel`, { token: customer.token });
    assert(r.status === 200 && r.body.data.booking.status === 'cancelled' && r.body.data.booking.can_cancel === false,
      'PUT /api/bookings/:id/cancel - Khách hủy đơn pending thành công');

    r = await call('PUT', `/api/bookings/${scheduledBooking.id}/cancel`, { token: customer.token });
    assert(r.status === 400, 'PUT /api/bookings/:id/cancel - Hủy lại đơn đã hủy (HTTP 400)');

    // ==================== 5. ADMIN - ĐƠN ĐẶT LỊCH ====================
    r = await call('GET', '/api/admin/bookings', { token: customer.token });
    assert(r.status === 403, 'RBAC - Customer truy cập GET /api/admin/bookings (HTTP 403)');

    r = await call('GET', '/api/admin/bookings');
    assert(r.status === 401, 'RBAC - Không có token truy cập GET /api/admin/bookings (HTTP 401)');

    r = await call('GET', '/api/admin/bookings?status=pending&limit=100', { token: adminToken });
    const adminRow = (r.body?.data?.bookings || []).find((b) => b.id === booking.id);
    assert(r.status === 200 && adminRow && adminRow.customer?.full_name && adminRow.services?.name,
      'GET /api/admin/bookings - Admin xem danh sách đơn kèm thông tin khách & dịch vụ');

    r = await call('GET', `/api/admin/bookings?customer_id=${customer.id}`, { token: adminToken });
    assert(r.status === 200 && r.body.data.bookings.length >= 2 &&
      r.body.data.bookings.every((b) => b.customer_id === customer.id),
    'GET /api/admin/bookings?customer_id= - Lọc theo khách hàng');

    r = await call('GET', '/api/admin/bookings?from=2020-01-01&to=2099-12-31&limit=5', { token: adminToken });
    assert(r.status === 200, 'GET /api/admin/bookings?from=&to= - Lọc theo khoảng ngày');

    r = await call('GET', '/api/admin/bookings?from=2030-01-01&to=2020-01-01', { token: adminToken });
    assert(r.status === 400, 'GET /api/admin/bookings - from sau to bị từ chối (HTTP 400)');

    r = await call('GET', `/api/admin/bookings/${booking.id}`, { token: adminToken });
    assert(r.status === 200 && r.body.data.allowed_next_statuses?.includes('confirmed'),
      'GET /api/admin/bookings/:id - Chi tiết đơn kèm allowed_next_statuses');

    // --- Luồng chuyển trạng thái ---
    const setStatus = (status, extra = {}) =>
      call('PUT', `/api/admin/bookings/${booking.id}/status`, { token: adminToken, body: { status, ...extra } });

    r = await call('PUT', `/api/admin/bookings/${booking.id}/status`, { token: customer.token, body: { status: 'confirmed' } });
    assert(r.status === 403, 'RBAC - Customer không được đổi trạng thái đơn (HTTP 403)');

    r = await setStatus('khong-hop-le');
    assert(r.status === 400, 'PUT /api/admin/bookings/:id/status - Trạng thái không hợp lệ (HTTP 400)');

    r = await setStatus('completed');
    assert(r.status === 400, 'PUT status - Không được nhảy cóc pending → completed (HTTP 400)');

    r = await setStatus('pending');
    assert(r.status === 400, 'PUT status - Đổi sang đúng trạng thái hiện tại (HTTP 400)');

    r = await setStatus('warranty_claim');
    assert(r.status === 400, 'PUT status - Không bảo hành khi đơn chưa hoàn thành (HTTP 400)');

    r = await setStatus('confirmed', { technician_id: techUnverified.id });
    assert(r.status === 400, 'PUT status - Không gán thợ chưa xác minh KYC (HTTP 400)');

    r = await setStatus('confirmed', { technician_id: customer.id });
    assert(r.status === 400, 'PUT status - technician_id không phải thợ (HTTP 400)');

    r = await setStatus('confirmed', { technician_id: techVerified.id });
    assert(r.status === 200 && r.body.data.booking.status === 'confirmed' &&
      r.body.data.booking.technician?.id === techVerified.id,
    'PUT status - pending → confirmed kèm gán thợ đã xác minh');

    r = await call('GET', `/api/bookings/${booking.id}`, { token: customer.token });
    assert(r.status === 200 && r.body.data.booking.status === 'confirmed' && r.body.data.booking.technician?.full_name,
      'Khách hàng thấy trạng thái "confirmed" và thông tin thợ được gán');

    r = await setStatus('in_progress');
    assert(r.status === 200 && r.body.data.booking.status === 'in_progress', 'PUT status - confirmed → in_progress');

    r = await call('PUT', `/api/bookings/${booking.id}/cancel`, { token: customer.token });
    assert(r.status === 400, 'Khách không được hủy đơn khi thợ đang sửa (in_progress) (HTTP 400)');

    r = await setStatus('completed');
    const completed = r.body?.data?.booking;
    assert(r.status === 200 && completed?.status === 'completed' && !!completed?.warranty_until,
      'PUT status - in_progress → completed, tự tính warranty_until');

    r = await setStatus('warranty_claim');
    assert(r.status === 200 && r.body.data.booking.status === 'warranty_claim',
      'PUT status - completed → warranty_claim (còn hạn bảo hành)');

    r = await setStatus('completed');
    assert(r.status === 200 && r.body.data.booking.warranty_until === completed.warranty_until,
      'PUT status - warranty_claim → completed, giữ nguyên hạn bảo hành cũ');

    r = await call('PUT', `/api/admin/bookings/${scheduledBooking.id}/status`, {
      token: adminToken,
      body: { status: 'confirmed' },
    });
    assert(r.status === 400, 'PUT status - Đơn đã hủy là trạng thái kết thúc, không đổi được (HTTP 400)');

    r = await call('PUT', `/api/admin/bookings/${FAKE_UUID}/status`, { token: adminToken, body: { status: 'confirmed' } });
    assert(r.status === 404, 'PUT status - Đơn không tồn tại (HTTP 404)');

    // ==================== 6. ADMIN - QUẢN LÝ DỊCH VỤ ====================
    const newService = {
      name: '[TEST] Vệ sinh quạt trần',
      category: 'Thiết bị gia dụng',
      description: 'Dịch vụ tạo bởi bộ test tự động',
      base_price: 90000,
      warranty_days: 5,
    };

    r = await call('POST', '/api/admin/services', { token: customer.token, body: newService });
    assert(r.status === 403, 'RBAC - Customer không được tạo dịch vụ (HTTP 403)');

    r = await call('POST', '/api/admin/services', { token: adminToken, body: { ...newService, base_price: -5 } });
    assert(r.status === 400 && r.body.errors?.some((e) => e.field === 'base_price'),
      'POST /api/admin/services - Giá âm bị từ chối (HTTP 400)');

    r = await call('POST', '/api/admin/services', { token: adminToken, body: { name: 'Thiếu giá' } });
    assert(r.status === 400, 'POST /api/admin/services - Thiếu trường bắt buộc (HTTP 400)');

    r = await call('POST', '/api/admin/services', { token: adminToken, body: newService });
    const createdService = r.body?.data?.service;
    assert(r.status === 201 && createdService?.id && createdService.is_active === true,
      'POST /api/admin/services - Admin tạo dịch vụ mới');

    r = await call('GET', `/api/services/${createdService.id}`);
    assert(r.status === 200 && Number(r.body.data.service.base_price) === 90000,
      'Dịch vụ vừa tạo hiển thị ngay ở API public');

    r = await call('PUT', `/api/admin/services/${createdService.id}`, { token: adminToken, body: {} });
    assert(r.status === 400, 'PUT /api/admin/services/:id - Không có dữ liệu để cập nhật (HTTP 400)');

    r = await call('PUT', `/api/admin/services/${createdService.id}`, {
      token: adminToken,
      body: { base_price: 120000, description: 'Đã đổi giá' },
    });
    assert(r.status === 200 && Number(r.body.data.service.base_price) === 120000,
      'PUT /api/admin/services/:id - Cập nhật giá dịch vụ');

    r = await call('PUT', `/api/admin/services/${FAKE_UUID}`, { token: adminToken, body: { base_price: 1000 } });
    assert(r.status === 404, 'PUT /api/admin/services/:id - Dịch vụ không tồn tại (HTTP 404)');

    r = await call('DELETE', `/api/admin/services/${createdService.id}`, { token: adminToken });
    assert(r.status === 200 && r.body.data.service.is_active === false,
      'DELETE /api/admin/services/:id - Ngừng cung cấp dịch vụ (xóa mềm)');

    r = await call('GET', `/api/services/${createdService.id}`);
    assert(r.status === 404, 'Dịch vụ đã ẩn không còn xem được ở API public (HTTP 404)');

    r = await call('GET', '/api/services?limit=100');
    assert(!r.body.data.services.some((s) => s.id === createdService.id),
      'Dịch vụ đã ẩn không còn trong danh sách public');

    r = await call('GET', '/api/admin/services?is_active=false&limit=100', { token: adminToken });
    assert(r.status === 200 && r.body.data.services.some((s) => s.id === createdService.id),
      'GET /api/admin/services?is_active=false - Admin vẫn thấy dịch vụ đã ẩn');

    r = await call('POST', '/api/bookings', {
      token: customer.token,
      body: { ...validBooking, service_id: createdService.id },
    });
    assert(r.status === 404, 'POST /api/bookings - Không đặt được dịch vụ đã ngừng cung cấp (HTTP 404)');

    // ==================== 7. REVIEWS (ĐÁNH GIÁ & PHẢN HỒI) ====================
    // 7.1. Đánh giá khi chưa đăng nhập
    r = await call('POST', `/api/bookings/${booking.id}/review`, { body: { rating: 5, comment: 'Rất tốt' } });
    assert(r.status === 401, 'POST /api/bookings/:id/review - Chưa đăng nhập bị từ chối (HTTP 401)');

    // 7.2. Admin không được đánh giá đơn (chỉ role customer)
    r = await call('POST', `/api/bookings/${booking.id}/review`, { token: adminToken, body: { rating: 5, comment: 'Admin đánh giá' } });
    assert(r.status === 403, 'POST /api/bookings/:id/review - Admin không được đánh giá (HTTP 403)');

    // 7.3. Khách hàng khác không được đánh giá đơn của người khác
    r = await call('POST', `/api/bookings/${booking.id}/review`, { token: customer2.token, body: { rating: 5, comment: 'Khách 2 đánh giá trộm' } });
    assert(r.status === 403, 'POST /api/bookings/:id/review - Khách hàng khác không được đánh giá đơn người khác (HTTP 403)');

    // 7.4. Đánh giá đơn chưa completed (ví dụ đơn scheduledBooking đã bị hủy / cancelled)
    r = await call('POST', `/api/bookings/${scheduledBooking.id}/review`, { token: customer.token, body: { rating: 5 } });
    assert(r.status === 400, 'POST /api/bookings/:id/review - Không được đánh giá đơn chưa completed (HTTP 400)');

    // 7.5. Rating không hợp lệ (< 1 hoặc > 5 hoặc không phải số)
    r = await call('POST', `/api/bookings/${booking.id}/review`, { token: customer.token, body: { rating: 6, comment: 'Quá 5 sao' } });
    assert(r.status === 400 && r.body.errors?.some((e) => e.field === 'rating'),
      'POST /api/bookings/:id/review - Rating > 5 bị từ chối (HTTP 400)');

    r = await call('POST', `/api/bookings/${booking.id}/review`, { token: customer.token, body: { rating: 0 } });
    assert(r.status === 400 && r.body.errors?.some((e) => e.field === 'rating'),
      'POST /api/bookings/:id/review - Rating = 0 bị từ chối (HTTP 400)');

    // 7.6. Đánh giá hợp lệ lần đầu (đơn booking đã ở trạng thái completed ở phần 5)
    r = await call('POST', `/api/bookings/${booking.id}/review`, {
      token: customer.token,
      body: { rating: 5, comment: 'Thợ sửa máy lạnh rất tận tình, giá đúng niêm yết!' },
    });
    assert(r.status === 201 && r.body.data?.review?.rating === 5 && r.body.data?.review?.booking_id === booking.id,
      'POST /api/bookings/:id/review - Đánh giá 5 sao thành công (HTTP 201)');

    // 7.7. Chặn đánh giá lần 2 trên cùng 1 đơn
    r = await call('POST', `/api/bookings/${booking.id}/review`, {
      token: customer.token,
      body: { rating: 4, comment: 'Đánh giá lần 2' },
    });
    assert(r.status === 400, 'POST /api/bookings/:id/review - Chặn spam đánh giá 2 lần (HTTP 400)');

    // 7.8. Kiểm tra chi tiết đơn trả về kèm thông tin review và cờ can_review = false
    r = await call('GET', `/api/bookings/${booking.id}`, { token: customer.token });
    assert(r.status === 200 && r.body.data.booking.can_review === false && !!r.body.data.booking.reviews,
      'GET /api/bookings/:id - Đã có review thì can_review = false và có reviews');

    // ==================== 8. DASHBOARD (DOANH THU & HOA HỒNG 15%) ====================
    // 8.1. Khách hàng không có quyền xem dashboard admin
    r = await call('GET', '/api/admin/dashboard', { token: customer.token });
    assert(r.status === 403, 'GET /api/admin/dashboard - Customer bị từ chối (HTTP 403)');

    // 8.2. Admin xem dashboard
    r = await call('GET', '/api/admin/dashboard', { token: adminToken });
    const dash = r.body?.data;
    assert(r.status === 200 && dash?.total_bookings >= 2 &&
      dash?.revenue && dash.revenue.commission_rate === 0.15 &&
      dash.revenue.total_revenue > 0 && dash.revenue.total_commission > 0 &&
      dash.status_counts && dash.status_counts.completed >= 1,
      'GET /api/admin/dashboard - Thống kê doanh thu, hoa hồng 15% và tỷ lệ trạng thái đơn đầy đủ');

    console.log('\n--------------------------------------------------');
    console.log(`Kết quả: ${passed} Passed | ${failed} Failed`);
    console.log('==================================================\n');
  } catch (err) {
    failed++;
    console.error('Lỗi khi chạy kiểm thử:', err);
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
});
