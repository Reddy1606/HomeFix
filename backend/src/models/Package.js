const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/database');

const LOCAL_PACKAGES_FILE = path.join(__dirname, '../../data/packages.json');

// Mức giá thâm nhập thị trường (Penetration Pricing) cực kỳ hợp lý cho đề án Khởi nghiệp EXE101
const DEFAULT_PACKAGES = [
  {
    id: 'pkg-basic-001',
    code: 'basic_6m',
    name: 'Gói Chăm Sóc Cơ Bản (HomeCare Basic)',
    description: 'Chỉ 25k/tháng! Phù hợp cho sinh viên, người độc thân hoặc căn hộ nhỏ cần bảo dưỡng thiết bị cơ bản định kỳ.',
    price: 149000, // Điều chỉnh từ 399.000đ -> 149.000đ (tiết kiệm, dễ chốt đơn)
    duration_months: 6,
    maintenance_quota: 1,
    warranty_days: 30,
    priority_level: 1,
    discount_percentage: 5,
    badge: 'Tiết kiệm sinh viên',
    features: [
      '1 lần vệ sinh/bảo dưỡng máy lạnh hoặc quạt điện miễn phí',
      'Bảo hành công việc 30 ngày (HomeFix bảo chứng)',
      'Ưu tiên nhận đơn trước các khách hàng thông thường',
      'Giảm 5% giá nhân công cho các dịch vụ sửa chữa phát sinh',
      'Tư vấn kỹ thuật trực tuyến 24/7'
    ],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'pkg-standard-002',
    code: 'standard_1y',
    name: 'Gói Chăm Sóc Toàn Diện 1 Năm (HomeCare Standard)',
    description: 'Lựa chọn phổ biến nhất cho gia đình từ 3-5 người. Đảm bảo toàn bộ thiết bị điện lạnh, điện nước hoạt động êm ái cả năm.',
    price: 299000, // Điều chỉnh từ 799.000đ -> 299.000đ (chỉ ~25k/tháng, gồm 2 lần bảo dưỡng)
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
    created_at: new Date().toISOString(),
  },
  {
    id: 'pkg-vip-003',
    code: 'vip_1y',
    name: 'Gói VIP Thượng Hạng 1 Năm (HomeCare VIP Platinum)',
    description: 'Đặc quyền trọn gói cao cấp cho cả gia đình. Đội ngũ thợ lành nghề hàng đầu (4.8★ - 5★) phục vụ tức thì.',
    price: 599000, // Điều chỉnh từ 1.499.000đ -> 599.000đ (chỉ ~50k/tháng cho trọn gói gia đình)
    duration_months: 12,
    maintenance_quota: 4,
    warranty_days: 90,
    priority_level: 3,
    discount_percentage: 15,
    badge: 'Đặc quyền VIP 👑',
    features: [
      '4 lần bảo dưỡng định kỳ trọn gói (2 máy lạnh + 1 máy giặt + 1 kiểm tra điện nước tổng)',
      'Bảo hành vàng 90 ngày (Miễn phí 100% công sửa nếu tái phát sự cố)',
      '⚡ HỎA TỐC VIP: Thợ Top Rating (4.8★ - 5.0★) tiếp nhận ngay trong 5-10 phút',
      'Ưu tiên tuyệt đối vào giờ cao điểm, mưa bão, ngày lễ Tết',
      'Giảm 15% tổng hóa đơn nhân công sửa chữa',
      'Đường dây nóng hỗ trợ ưu tiên trực tiếp cùng Quản trị viên'
    ],
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

function readLocalPackages() {
  try {
    if (!fs.existsSync(LOCAL_PACKAGES_FILE)) {
      fs.mkdirSync(path.dirname(LOCAL_PACKAGES_FILE), { recursive: true });
      fs.writeFileSync(LOCAL_PACKAGES_FILE, JSON.stringify(DEFAULT_PACKAGES, null, 2), 'utf-8');
      return DEFAULT_PACKAGES;
    }
    const content = fs.readFileSync(LOCAL_PACKAGES_FILE, 'utf-8');
    const parsed = JSON.parse(content || '[]');
    // Nếu file cũ có giá cao (399k / 799k / 1.499k), cập nhật sang giá hợp lý mới
    if (parsed.some(p => p.price > 600000 && p.code === 'standard_1y')) {
      writeLocalPackages(DEFAULT_PACKAGES);
      return DEFAULT_PACKAGES;
    }
    return parsed.length > 0 ? parsed : DEFAULT_PACKAGES;
  } catch (err) {
    console.error('Lỗi đọc local packages:', err.message);
    return DEFAULT_PACKAGES;
  }
}

function writeLocalPackages(packages) {
  try {
    fs.mkdirSync(path.dirname(LOCAL_PACKAGES_FILE), { recursive: true });
    fs.writeFileSync(LOCAL_PACKAGES_FILE, JSON.stringify(packages, null, 2), 'utf-8');
  } catch (err) {
    console.error('Lỗi ghi local packages:', err.message);
  }
}

class Package {
  static async findAll({ activeOnly = false } = {}) {
    try {
      let query = supabase.from('service_packages').select('*').order('price', { ascending: true });
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (e) {
      // Supabase table chưa tồn tại hoặc lỗi mạng, fallback local
    }

    const localList = readLocalPackages();
    return activeOnly ? localList.filter((p) => p.is_active) : localList;
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data;
    } catch (e) {
      // fallback
    }

    const localList = readLocalPackages();
    return localList.find((p) => p.id === id || p.code === id) || null;
  }

  static async update(id, updateData) {
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    } catch (e) {
      // fallback
    }

    const localList = readLocalPackages();
    const idx = localList.findIndex((p) => p.id === id || p.code === id);
    if (idx === -1) return null;
    localList[idx] = { ...localList[idx], ...updateData, updated_at: new Date().toISOString() };
    writeLocalPackages(localList);
    return localList[idx];
  }
}

module.exports = Package;
