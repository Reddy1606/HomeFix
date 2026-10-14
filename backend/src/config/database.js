const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

// Supabase client sử dụng service_role key để bypass RLS
// Dùng cho server-side operations (KHÔNG dùng ở client)
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Kiểm tra kết nối database
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error && error.code === '42P01') {
      // Bảng chưa tồn tại - OK, sẽ tạo sau
      console.log('⚠️  Database connected nhưng bảng users chưa tồn tại. Hãy chạy migration.');
      return true;
    }
    if (error) {
      throw error;
    }
    console.log('✅ Database connection thành công!');
    return true;
  } catch (err) {
    console.error('❌ Database connection thất bại:', err.message);
    return false;
  }
};

module.exports = { supabase, testConnection };
