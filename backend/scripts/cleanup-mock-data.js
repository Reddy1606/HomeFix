const { supabase } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function cleanMockData() {
  console.log('🧹 Bắt đầu dọn dẹp dữ liệu mock test...');

  // 1. Lấy danh sách users test
  const { data: testUsers, error: userErr } = await supabase
    .from('users')
    .select('id, email, full_name')
    .like('email', '%@homefix.test');

  if (userErr) {
    console.error('❌ Lỗi khi lấy danh sách user test:', userErr);
    process.exit(1);
  }

  console.log(`📋 Tìm thấy ${testUsers.length} tài khoản test (@homefix.test)`);
  const testUserIds = testUsers.map(u => u.id);

  if (testUserIds.length === 0) {
    console.log('✅ Không có tài khoản test nào cần xóa.');
    return;
  }

  // 2. Xóa các đơn đặt dịch vụ (bookings) liên quan đến user test
  // Lấy danh sách bookings cần xóa
  const { data: allBookings, error: bErr } = await supabase
    .from('bookings')
    .select('id, customer_id, technician_id');

  if (!bErr && allBookings) {
    const testBookings = allBookings.filter(
      b => testUserIds.includes(b.customer_id) || testUserIds.includes(b.technician_id)
    );
    const testBookingIds = testBookings.map(b => b.id);
    console.log(`📋 Tìm thấy ${testBookingIds.length} đơn booking test liên quan`);

    if (testBookingIds.length > 0) {
      // Xóa theo từng batch nếu cần
      for (let i = 0; i < testBookingIds.length; i += 20) {
        const batch = testBookingIds.slice(i, i + 20);
        const { error: delBErr } = await supabase
          .from('bookings')
          .delete()
          .in('id', batch);
        if (delBErr) {
          console.error('⚠️ Lỗi xóa bookings batch:', delBErr.message);
        }
      }
      console.log(`✅ Đã xóa ${testBookingIds.length} đơn booking test`);
    }
  }

  // 3. Xóa các bảng liên quan khác (nếu có dữ liệu của user test)
  const relatedTables = ['reviews', 'payments', 'wallets', 'wallet_transactions', 'notifications', 'technician_profiles'];
  for (const table of relatedTables) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .in('user_id', testUserIds);
      if (!error) {
        console.log(`✅ Đã kiểm tra/dọn dẹp bảng ${table}`);
      }
    } catch {
      // Một số bảng có thể không có cột user_id hoặc không có dữ liệu
    }
  }

  // 4. Xóa các user test trong bảng users
  for (let i = 0; i < testUserIds.length; i += 20) {
    const batch = testUserIds.slice(i, i + 20);
    const { error: delUsersErr } = await supabase
      .from('users')
      .delete()
      .in('id', batch);
    if (delUsersErr) {
      console.error('⚠️ Lỗi khi xóa users batch:', delUsersErr.message);
    }
  }
  console.log(`✅ Đã xóa thành công ${testUsers.length} tài khoản test khỏi bảng users`);

  // 5. Dọn dẹp các file rác trong thư mục uploads/kyc và uploads/avatars
  const uploadDirs = [
    path.join(__dirname, '..', 'public', 'uploads', 'kyc'),
    path.join(__dirname, '..', 'public', 'uploads', 'avatars'),
  ];

  for (const dir of uploadDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      let deletedCount = 0;
      for (const file of files) {
        if (file === '.gitignore') continue;
        fs.unlinkSync(path.join(dir, file));
        deletedCount++;
      }
      console.log(`🗑️ Đã dọn dẹp ${deletedCount} file tạm trong ${path.basename(dir)}`);
    }
  }

  // 6. Kiểm tra lại dữ liệu còn lại trong DB
  const { data: remainingUsers } = await supabase
    .from('users')
    .select('id, email, full_name, role');
  console.log('\n📊 DANH SÁCH TÀI KHOẢN CÒN LẠI TRONG HỆ THỐNG:');
  console.table(remainingUsers);

  const { data: remainingBookings } = await supabase
    .from('bookings')
    .select('id, customer_id, technician_id, status, total_price');
  console.log('\n📊 DANH SÁCH BOOKING CÒN LẠI:');
  console.table(remainingBookings);

  console.log('\n🎉 Hoàn thành dọn dẹp mock test data!');
}

cleanMockData().catch(err => {
  console.error('Lỗi quy trình dọn dẹp:', err);
  process.exit(1);
});
