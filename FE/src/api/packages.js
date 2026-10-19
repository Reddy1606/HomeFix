import client from './client';

/**
 * Lấy danh sách các gói dịch vụ công khai
 */
export async function fetchPackages() {
  try {
    const res = await client.get('/api/packages');
    return res.data?.data?.packages || [];
  } catch (err) {
    console.warn('API /api/packages không khả dụng, dùng dữ liệu dự phòng:', err.message);
    return [
      {
        id: 'pkg-basic-001',
        code: 'basic_6m',
        name: 'Gói Chăm Sóc Cơ Bản (HomeCare Basic)',
        description: 'Chỉ 25k/tháng! Tiết kiệm phù hợp cho sinh viên, người độc thân hoặc căn hộ nhỏ cần bảo dưỡng đồ điện cơ bản.',
        price: 149000,
        duration_months: 6,
        maintenance_quota: 1,
        warranty_days: 30,
        priority_level: 1,
        discount_percentage: 5,
        badge: 'Tiết kiệm sinh viên',
        features: [
          '1 lần bảo dưỡng/vệ sinh máy lạnh hoặc quạt điện miễn phí',
          'Bảo hành công việc 30 ngày (HomeFix bảo chứng)',
          'Ưu tiên nhận đơn trước khách thông thường',
          'Giảm 5% giá nhân công cho các lần sửa chữa phát sinh',
          'Hỗ trợ tư vấn kỹ thuật trực tuyến 24/7'
        ],
        is_active: true,
      },
      {
        id: 'pkg-standard-002',
        code: 'standard_1y',
        name: 'Gói Chăm Sóc Toàn Diện 1 Năm (HomeCare Standard)',
        description: 'Lựa chọn phổ biến nhất cho gia đình từ 3-5 thành viên. Đảm bảo toàn bộ thiết bị điện lạnh, điện nước luôn hoạt động êm ái suốt cả năm.',
        price: 299000,
        duration_months: 12,
        maintenance_quota: 2,
        warranty_days: 60,
        priority_level: 2,
        discount_percentage: 10,
        badge: 'Phổ biến nhất ⭐',
        features: [
          '2 lần bảo dưỡng điều hòa / thiết bị gia dụng miễn phí trong 1 năm',
          'Bảo hành dịch vụ lên đến 60 ngày - Thợ xử lý miễn phí nếu tái phát',
          '⚡ Cam kết thợ nhận đơn trong vòng 15-30 phút (Hàng đợi ưu tiên)',
          'Giảm 10% chi phí nhân công toàn bộ dịch vụ phát sinh',
          'Miễn phí kiểm tra & chẩn đoán sự cố tại nhà (Call-out fee)'
        ],
        is_active: true,
      },
      {
        id: 'pkg-vip-003',
        code: 'vip_1y',
        name: 'Gói VIP Thượng Hạng 1 Năm (HomeCare VIP Platinum)',
        description: 'Đặc quyền cao cấp nhất dành cho gia đình, biệt thự và nhà phố. Thợ lành nghề hàng đầu (4.8★ - 5★) phục vụ tức thì.',
        price: 599000,
        duration_months: 12,
        maintenance_quota: 4,
        warranty_days: 90,
        priority_level: 3,
        discount_percentage: 15,
        badge: 'Đặc quyền VIP 👑',
        features: [
          '4 lần bảo dưỡng định kỳ trọn gói (2 máy lạnh + 1 máy giặt + 1 kiểm tra điện nước tổng)',
          'Bảo hành vàng 90 ngày (Miễn phí 100% công sửa nếu phát sinh lỗi)',
          '⚡ HỎA TỐC VIP: Thợ Top Rating (4.8★ - 5.0★) tiếp nhận ngay trong 5-10 phút',
          'Ưu tiên tuyệt đối vào giờ cao điểm, mưa bão, ngày lễ Tết',
          'Giảm 15% tổng hóa đơn nhân công sửa chữa',
          'Đường dây nóng hỗ trợ ưu tiên trực tiếp cùng Quản trị viên'
        ],
        is_active: true,
      },
    ];
  }
}

/**
 * Lấy thông tin gói đang kích hoạt của khách hàng
 */
export async function fetchMySubscription() {
  const res = await client.get('/api/packages/my-subscription');
  return res.data?.data;
}

/**
 * Đăng ký mua gói dịch vụ
 */
export async function subscribePackage(packageId, paymentMethod = 'bank_transfer') {
  const res = await client.post('/api/packages/subscribe', {
    package_id: packageId,
    payment_method: paymentMethod,
  });
  return res.data;
}

/**
 * Lấy danh sách thuê bao và thống kê doanh thu gói (Admin)
 */
export async function fetchAdminSubscriptions(params = {}) {
  const res = await client.get('/api/packages/admin/subscriptions', { params });
  return res.data?.data;
}
