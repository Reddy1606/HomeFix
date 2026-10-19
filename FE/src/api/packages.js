import client from './client';

/**
 * Lấy danh sách các gói dịch vụ công khai
 */
export async function fetchPackages() {
  try {
    const res = await client.get('/packages');
    return res.data?.data?.packages || [];
  } catch (err) {
    console.warn('API /packages không khả dụng, dùng dữ liệu dự phòng:', err.message);
    return [
      {
        id: 'pkg-basic-001',
        code: 'basic_6m',
        name: 'Gói Chăm Sóc Cơ Bản (HomeCare Basic)',
        description: 'Chỉ ~41.500đ/tháng. Số tiền trả trước nhỏ, phù hợp để khách hàng trải nghiệm dịch vụ. Lấy vệ sinh 1 máy lạnh tiêu chuẩn làm quyền lợi cốt lõi.',
        price: 249000,
        duration_months: 6,
        maintenance_quota: 1,
        warranty_days: 30,
        priority_level: 1,
        discount_percentage: 5,
        badge: 'Trải nghiệm tiết kiệm',
        features: [
          '1 lượt vệ sinh máy lạnh tiêu chuẩn (hoặc thiết bị tiêu chuẩn) miễn phí',
          'Bảo hành chất lượng công việc 30 ngày (HomeFix bảo chứng)',
          'Ưu tiên nhận đơn trước các khách hàng thông thường',
          'Giảm 5% tiền công cho các dịch vụ sửa chữa phát sinh',
          'Hỗ trợ tư vấn kỹ thuật trực tuyến 24/7'
        ],
        is_active: true,
      },
      {
        id: 'pkg-standard-002',
        code: 'standard_1y',
        name: 'Gói Chăm Sóc Toàn Diện 1 Năm (HomeCare Standard)',
        description: 'Chỉ ~45.750đ/tháng. Dành cho khách hàng cần 2 lượt bảo dưỡng trong năm, bảo hành dài hạn 60 ngày và kiểm tra tại nhà có giới hạn.',
        price: 549000,
        duration_months: 12,
        maintenance_quota: 2,
        warranty_days: 60,
        priority_level: 2,
        discount_percentage: 10,
        badge: 'Phổ biến nhất ⭐',
        features: [
          '2 lượt bảo dưỡng/vệ sinh thiết bị tiêu chuẩn miễn phí trong 1 năm',
          'Bảo hành dịch vụ mở rộng lên đến 60 ngày (Thợ xử lý miễn phí nếu tái phát)',
          '⚡ Cam kết thợ nhận đơn trong vòng 15-30 phút (Hàng đợi ưu tiên)',
          'Giảm 10% chi phí tiền công cho toàn bộ dịch vụ phát sinh',
          'Miễn phí kiểm tra & chẩn đoán sự cố tại nhà có giới hạn'
        ],
        is_active: true,
      },
      {
        id: 'pkg-vip-003',
        code: 'vip_1y',
        name: 'Gói VIP Thượng Hạng 1 Năm (HomeCare VIP Platinum)',
        description: 'Chỉ ~99.917đ/tháng. Đầy đủ ngân sách chăm sóc toàn diện thiết bị gia đình: 2 máy lạnh, 1 máy giặt và 1 kiểm tra điện nước tổng.',
        price: 1199000,
        duration_months: 12,
        maintenance_quota: 4,
        warranty_days: 90,
        priority_level: 3,
        discount_percentage: 15,
        badge: 'Đặc quyền VIP 👑',
        features: [
          'Trọn gói 4 lượt: 2 lượt máy lạnh + 1 lượt máy giặt + 1 lượt kiểm tra điện nước tổng',
          'Bảo hành vàng 90 ngày (HomeFix bảo chứng 100% công sửa nếu tái phát)',
          '⚡ HỎA TỐC VIP: Thợ Top Rating (4.8★ - 5★) tiếp nhận ngay trong 5-10 phút',
          'Ưu tiên tuyệt đối vào giờ cao điểm, mưa bão, ngày lễ Tết',
          'Giảm 15% tổng hóa đơn tiền công sửa chữa phát sinh',
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
  const res = await client.get('/packages/my-subscription');
  return res.data?.data;
}

/**
 * Đăng ký mua gói dịch vụ
 */
export async function subscribePackage(packageId, paymentMethod = 'bank_transfer') {
  const res = await client.post('/packages/subscribe', {
    package_id: packageId,
    payment_method: paymentMethod,
  });
  return res.data;
}

/**
 * Hủy gói dịch vụ đang kích hoạt của khách hàng
 */
export async function cancelSubscription() {
  const res = await client.post('/packages/cancel');
  return res.data;
}

/**
 * Lấy danh sách thuê bao và thống kê doanh thu gói (Admin)
 */
export async function fetchAdminSubscriptions(params = {}) {
  const res = await client.get('/packages/admin/subscriptions', { params });
  return res.data?.data;
}
