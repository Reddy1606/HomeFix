/**
 * Seed dữ liệu DEMO cho HomeFix (Backend 2)
 *
 * Chạy:  npm run seed
 *
 * Script an toàn khi chạy lại nhiều lần (idempotent):
 *  - Dịch vụ: chỉ thêm dịch vụ chưa có (so theo tên)
 *  - Tài khoản demo: chỉ tạo tài khoản chưa có (so theo email)
 *  - Đơn đặt lịch: chỉ tạo nếu khách demo chưa có đơn nào
 *
 * Yêu cầu: đã chạy migration.sql và có file .env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
 */
const { supabase } = require('../config/database');
const { hashPassword } = require('../utils/helpers');
const { vnDateString } = require('../utils/date');

// ==================== DỮ LIỆU MẪU ====================

const EXTRA_SERVICES = [
  { name: 'Sửa tủ lạnh không lạnh', category: 'Điện lạnh', description: 'Kiểm tra block, gas, quạt gió và sửa tủ lạnh không đủ lạnh', base_price: 400000, warranty_days: 30 },
  { name: 'Nạp gas máy lạnh', category: 'Điện lạnh', description: 'Kiểm tra rò rỉ và nạp bổ sung gas máy lạnh dân dụng', base_price: 250000, warranty_days: 30 },
  { name: 'Thông tắc bồn cầu, cống thoát nước', category: 'Điện nước', description: 'Thông tắc bồn cầu, bồn rửa, cống thoát sàn bằng dụng cụ chuyên dụng', base_price: 200000, warranty_days: 14 },
  { name: 'Lắp đặt ổ cắm, công tắc điện', category: 'Điện nước', description: 'Lắp mới hoặc thay thế ổ cắm, công tắc điện trong nhà', base_price: 100000, warranty_days: 14 },
  { name: 'Sửa bình nóng lạnh', category: 'Thiết bị gia dụng', description: 'Sửa bình nóng lạnh không nóng, rò điện, đóng cặn', base_price: 280000, warranty_days: 30 },
  { name: 'Sửa lò vi sóng', category: 'Thiết bị gia dụng', description: 'Kiểm tra và sửa lò vi sóng không nóng, không quay đĩa', base_price: 220000, warranty_days: 30 },
  { name: 'Sửa bản lề, cánh tủ gỗ', category: 'Đồ gỗ nội thất', description: 'Thay bản lề, chỉnh cánh tủ bị xệ, hở', base_price: 100000, warranty_days: 14 },
  { name: 'Lắp kệ treo tường', category: 'Đồ gỗ nội thất', description: 'Khoan tường, bắt vít và lắp kệ treo tường chắc chắn', base_price: 150000, warranty_days: 14 },
];

const DEMO_PASSWORDS = {
  customer: 'Customer@123',
  technician: 'Technician@123',
};

const DEMO_USERS = [
  { email: 'khach1@homefix.vn', full_name: 'Nguyễn Văn An', phone: '0911000001', role: 'customer', address: '12 Lê Lợi, Quận 1, TP.HCM' },
  { email: 'khach2@homefix.vn', full_name: 'Trần Thị Bình', phone: '0911000002', role: 'customer', address: '45 Võ Văn Ngân, TP. Thủ Đức, TP.HCM' },
  { email: 'tho1@homefix.vn', full_name: 'Lê Minh Cường (Thợ điện lạnh)', phone: '0911000003', role: 'technician', address: 'Quận 7, TP.HCM' },
  { email: 'tho2@homefix.vn', full_name: 'Phạm Quốc Dũng (Thợ điện nước)', phone: '0911000004', role: 'technician', address: 'Quận Bình Thạnh, TP.HCM' },
];

// Đơn demo: bao phủ đủ các trạng thái để demo Frontend & Dashboard
// daysAgo: đơn được tạo cách đây bao nhiêu ngày
const DEMO_BOOKINGS = [
  { customer: 'khach1@homefix.vn', service: 'Sửa máy lạnh không lạnh', status: 'pending', type: 'immediate', daysAgo: 0, address: '12 Lê Lợi, Quận 1, TP.HCM', description: 'Máy lạnh phòng ngủ bật lên chỉ ra gió, không mát.' },
  { customer: 'khach1@homefix.vn', service: 'Bảo dưỡng máy lạnh', status: 'pending', type: 'scheduled', daysAgo: 1, scheduleInDays: 2, address: '12 Lê Lợi, Quận 1, TP.HCM', description: 'Vệ sinh 2 máy lạnh phòng khách và phòng ngủ.' },
  { customer: 'khach1@homefix.vn', service: 'Thay vòi nước', status: 'confirmed', type: 'immediate', daysAgo: 1, technician: 'tho2@homefix.vn', address: '12 Lê Lợi, Quận 1, TP.HCM', description: 'Vòi nước bồn rửa chén bị rỉ nước.' },
  { customer: 'khach1@homefix.vn', service: 'Sửa máy giặt', status: 'in_progress', type: 'immediate', daysAgo: 2, technician: 'tho1@homefix.vn', address: '12 Lê Lợi, Quận 1, TP.HCM', description: 'Máy giặt không vắt, báo lỗi E3.' },
  { customer: 'khach1@homefix.vn', service: 'Thay bóng đèn', status: 'completed', type: 'immediate', daysAgo: 5, technician: 'tho2@homefix.vn', address: '12 Lê Lợi, Quận 1, TP.HCM', description: 'Thay 3 bóng đèn LED phòng khách.' },
  { customer: 'khach1@homefix.vn', service: 'Sửa khóa cửa', status: 'cancelled', type: 'immediate', daysAgo: 7, address: '12 Lê Lợi, Quận 1, TP.HCM', description: 'Khóa cửa chính bị kẹt.' },
  { customer: 'khach2@homefix.vn', service: 'Sửa rò rỉ ống nước', status: 'pending', type: 'immediate', daysAgo: 0, address: '45 Võ Văn Ngân, TP. Thủ Đức, TP.HCM', description: 'Ống nước dưới bồn rửa mặt bị rỉ.' },
  { customer: 'khach2@homefix.vn', service: 'Sửa aptomat chập cháy', status: 'completed', type: 'immediate', daysAgo: 10, technician: 'tho2@homefix.vn', address: '45 Võ Văn Ngân, TP. Thủ Đức, TP.HCM', description: 'Aptomat tổng hay nhảy, có mùi khét.' },
];

// ==================== HÀM TIỆN ÍCH ====================

const DAY_MS = 24 * 60 * 60 * 1000;
const check = (error, context) => {
  if (error) throw new Error(`${context}: ${error.message}`);
};

// ==================== CÁC BƯỚC SEED ====================

const seedServices = async () => {
  const { data: existing, error } = await supabase.from('services').select('name');
  check(error, 'Đọc danh sách dịch vụ');

  const existingNames = new Set(existing.map((s) => s.name));
  const toInsert = EXTRA_SERVICES.filter((s) => !existingNames.has(s.name));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase.from('services').insert(toInsert);
    check(insertError, 'Thêm dịch vụ');
  }
  console.log(`✅ Dịch vụ: thêm ${toInsert.length} mới, bỏ qua ${EXTRA_SERVICES.length - toInsert.length} đã có.`);
};

const seedUsers = async () => {
  const idByEmail = {};
  let created = 0;

  for (const user of DEMO_USERS) {
    const { data: found, error } = await supabase.from('users').select('id').eq('email', user.email).maybeSingle();
    check(error, `Kiểm tra tài khoản ${user.email}`);

    if (found) {
      idByEmail[user.email] = found.id;
      continue;
    }

    const isTech = user.role === 'technician';
    const { data, error: insertError } = await supabase
      .from('users')
      .insert([{
        ...user,
        password_hash: await hashPassword(DEMO_PASSWORDS[user.role]),
        is_verified: true, // thợ demo đã được admin xác minh KYC
        skill_verified: isTech,
        is_active: true,
      }])
      .select('id')
      .single();
    check(insertError, `Tạo tài khoản ${user.email}`);

    idByEmail[user.email] = data.id;
    created++;
  }
  console.log(`✅ Tài khoản demo: tạo ${created} mới, bỏ qua ${DEMO_USERS.length - created} đã có.`);
  return idByEmail;
};

const seedBookings = async (userIds) => {
  // Chỉ tạo đơn demo khi khách demo chưa có đơn nào (tránh nhân đôi khi chạy lại)
  const customerIds = DEMO_USERS.filter((u) => u.role === 'customer').map((u) => userIds[u.email]);
  const { count, error } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .in('customer_id', customerIds);
  check(error, 'Kiểm tra đơn demo');

  if (count > 0) {
    console.log(`⏭️  Đơn đặt lịch: khách demo đã có ${count} đơn, bỏ qua.`);
    return;
  }

  const { data: services, error: svcError } = await supabase.from('services').select('id, name, base_price, warranty_days');
  check(svcError, 'Đọc dịch vụ');
  const serviceByName = Object.fromEntries(services.map((s) => [s.name, s]));

  const rows = [];
  for (const b of DEMO_BOOKINGS) {
    const service = serviceByName[b.service];
    if (!service) {
      console.warn(`⚠️  Không tìm thấy dịch vụ "${b.service}", bỏ qua 1 đơn demo.`);
      continue;
    }

    const createdAt = new Date(Date.now() - b.daysAgo * DAY_MS);
    rows.push({
      customer_id: userIds[b.customer],
      technician_id: b.technician ? userIds[b.technician] : null,
      service_id: service.id,
      status: b.status,
      booking_type: b.type,
      scheduled_at: b.type === 'scheduled' ? new Date(Date.now() + (b.scheduleInDays || 1) * DAY_MS).toISOString() : null,
      address: b.address,
      description: b.description,
      total_price: service.base_price,
      warranty_until: b.status === 'completed'
        ? vnDateString((service.warranty_days || 0) - b.daysAgo)
        : null,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString(),
    });
  }

  const { error: insertError } = await supabase.from('bookings').insert(rows);
  check(insertError, 'Thêm đơn đặt lịch demo');
  console.log(`✅ Đơn đặt lịch demo: tạo ${rows.length} đơn (đủ các trạng thái).`);
};

// ==================== CHẠY ====================

const run = async () => {
  console.log('\n🌱 Bắt đầu seed dữ liệu demo HomeFix...\n');
  await seedServices();
  const userIds = await seedUsers();
  await seedBookings(userIds);

  console.log('\n--------------------------------------------------');
  console.log('Tài khoản demo:');
  console.log('  Admin      admin@homefix.vn   / Admin@123');
  console.log(`  Khách hàng khach1@homefix.vn  / ${DEMO_PASSWORDS.customer}`);
  console.log(`             khach2@homefix.vn  / ${DEMO_PASSWORDS.customer}`);
  console.log(`  Thợ        tho1@homefix.vn    / ${DEMO_PASSWORDS.technician}`);
  console.log(`             tho2@homefix.vn    / ${DEMO_PASSWORDS.technician}`);
  console.log('--------------------------------------------------\n');
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed thất bại:', err.message);
    process.exit(1);
  });
