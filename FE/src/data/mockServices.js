// Dữ liệu dịch vụ mẫu - dùng tạm khi Backend 2 chưa triển khai xong API /services
// Cấu trúc field khớp 100% với bảng `services` trong migration.sql (snake_case)
// `image_url` là field bổ sung ở Frontend (chưa có trong schema), trỏ tới ảnh
// tư liệu mở (Wikimedia Commons - được phép sử dụng tự do) minh họa cho dịch vụ.
// Nếu Backend trả về service không có image_url, giao diện tự fallback về icon.
const commonsImage = (fileName) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${fileName}?width=640`;

export const SERVICE_CATEGORIES = [
  { slug: 'dien-lanh', name: 'Điện lạnh', icon: '❄️' },
  { slug: 'dien-nuoc', name: 'Điện nước', icon: '🔧' },
  { slug: 'thiet-bi-gia-dung', name: 'Thiết bị gia dụng', icon: '🧺' },
  { slug: 'do-go-noi-that', name: 'Đồ gỗ nội thất', icon: '🚪' },
];

export const MOCK_SERVICES = [
  {
    id: 's1',
    name: 'Bảo dưỡng máy lạnh',
    category: 'Điện lạnh',
    description:
      'Vệ sinh dàn nóng, dàn lạnh, kiểm tra gas và hiệu suất làm lạnh định kỳ giúp máy bền và tiết kiệm điện hơn.',
    base_price: 139000,
    price_unit: 'per_job',
    warranty_days: 30,
    is_active: true,
    image_url: commonsImage('Outside_air_conditioner.jpg'),
  },
  {
    id: 's2',
    name: 'Sửa máy lạnh không lạnh',
    category: 'Điện lạnh',
    description:
      'Kiểm tra gas, block nén, bo mạch điều khiển và khắc phục triệt để tình trạng máy lạnh chạy nhưng không mát.',
    base_price: 199000,
    price_unit: 'per_job',
    warranty_days: 30,
    is_active: true,
    image_url: commonsImage(
      'MITSUBISHI_ELECTRIC_WINDOW_TYPE_AIR_CONDITIONER_OUTDOOR_UNIT.jpg',
    ),
  },
  {
    id: 's3',
    name: 'Thay vòi nước',
    category: 'Điện nước',
    description:
      'Tháo lắp, thay thế vòi nước bồn rửa chén, lavabo bị rò rỉ hoặc hư hỏng bằng vật tư chính hãng.',
    base_price: 89000,
    price_unit: 'per_job',
    warranty_days: 14,
    is_active: true,
    image_url: commonsImage('Brass_water_tap.jpg'),
  },
  {
    id: 's4',
    name: 'Sửa rò rỉ ống nước',
    category: 'Điện nước',
    description:
      'Dò tìm chính xác điểm rò rỉ trong tường, sàn nhà và xử lý dứt điểm, hạn chế đục phá diện rộng.',
    base_price: 149000,
    price_unit: 'per_job',
    warranty_days: 14,
    is_active: true,
    image_url: commonsImage('Dripping_faucet_2.jpg'),
  },
  {
    id: 's5',
    name: 'Sửa aptomat chập cháy',
    category: 'Điện nước',
    description:
      'Kiểm tra tải điện, thay thế aptomat (CB) bị chập cháy, đảm bảo an toàn phòng cháy nổ cho gia đình.',
    base_price: 129000,
    price_unit: 'per_job',
    warranty_days: 14,
    is_active: true,
    image_url: commonsImage('Electrical_panel_opened.jpg'),
  },
  {
    id: 's6',
    name: 'Thay bóng đèn',
    category: 'Điện nước',
    description:
      'Thay thế bóng đèn led, đèn huỳnh quang, đèn chùm các loại tại nhà, nhanh chóng trong 30 phút.',
    base_price: 49000,
    price_unit: 'per_job',
    warranty_days: 7,
    is_active: true,
    image_url: commonsImage('LED_bulbs_2012.jpg'),
  },
  {
    id: 's7',
    name: 'Sửa máy giặt',
    category: 'Thiết bị gia dụng',
    description:
      'Kiểm tra lỗi không vắt, không xả nước, kêu to bất thường và sửa chữa máy giặt cửa trên/cửa trước.',
    base_price: 179000,
    price_unit: 'per_job',
    warranty_days: 30,
    is_active: true,
    image_url: commonsImage('Front_loader_Washing_machine.jpg'),
  },
  {
    id: 's8',
    name: 'Sửa khóa cửa',
    category: 'Đồ gỗ nội thất',
    description:
      'Sửa chữa hoặc thay thế khóa cửa chính, cửa phòng bị kẹt, gãy chìa, mất chìa khóa.',
    base_price: 99000,
    price_unit: 'per_job',
    warranty_days: 14,
    is_active: true,
    image_url: commonsImage('Door_lock.jpg'),
  },
  {
    id: 's9',
    name: 'Sửa quạt treo tường',
    category: 'Thiết bị gia dụng',
    description:
      'Khắc phục quạt không quay, quay yếu, phát ra tiếng kêu to bất thường khi vận hành.',
    base_price: 79000,
    price_unit: 'per_job',
    warranty_days: 14,
    is_active: true,
    image_url: commonsImage('OSCILLATING_WALL_FAN.jpg'),
  },
  {
    id: 's10',
    name: 'Kiểm tra hệ thống điện nước tổng',
    category: 'Điện nước',
    description:
      'Rà soát toàn diện hệ thống điện và cấp thoát nước trong nhà, phát hiện sớm nguy cơ hư hỏng.',
    base_price: 199000,
    price_unit: 'per_job',
    warranty_days: 7,
    is_active: true,
    image_url: commonsImage('Electrician_Working.jpg'),
  },
];

export function getCategoryIcon(categoryName) {
  const found = SERVICE_CATEGORIES.find((c) => c.name === categoryName);
  return found ? found.icon : '🛠️';
}
