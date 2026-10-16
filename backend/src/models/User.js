const { supabase } = require('../config/database');

/**
 * User Model - Thao tác với bảng users trên Supabase
 * Hỗ trợ 3 role: customer, technician, admin
 */
class User {
  /**
   * Tạo user mới
   * @param {Object} userData - { email, password_hash, full_name, phone, role, address }
   * @returns {Promise<Object>} User vừa tạo (không bao gồm password_hash)
   */
  static async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select('id, email, full_name, phone, role, address, avatar_url, is_verified, is_active, created_at')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Tìm user theo email (bao gồm password_hash để verify login)
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code === 'PGRST116') return null; // Not found
    if (error) throw error;
    return data;
  }

  /**
   * Tìm user theo ID (không trả password_hash)
   * @param {string} id - UUID
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, address, avatar_url, is_verified, cccd_number, skill_verified, rating_avg, total_reviews, is_active, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  /**
   * Cập nhật thông tin user
   * @param {string} id - UUID
   * @param {Object} updateData - Dữ liệu cần cập nhật
   * @returns {Promise<Object>} User đã cập nhật
   */
  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, email, full_name, phone, role, address, avatar_url, is_verified, is_active, updated_at')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Cập nhật mật khẩu
   * @param {string} id - UUID
   * @param {string} passwordHash - Mật khẩu mới đã hash
   * @returns {Promise<boolean>}
   */
  static async updatePassword(id, passwordHash) {
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Lấy danh sách users (Admin only)
   * @param {Object} options - { page, limit, role }
   * @returns {Promise<{ users: Array, total: number }>}
   */
  static async findAll({ page = 1, limit = 20, role = null, search = null } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('users')
      .select('id, email, full_name, phone, role, address, is_verified, skill_verified, rating_avg, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (role) {
      query = query.eq('role', role);
    }

    if (search && search.trim()) {
      const term = search.trim();
      query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { users: data, total: count };
  }

  /**
   * Xác minh thợ (Admin verify technician)
   * @param {string} id - UUID của thợ
   * @param {boolean} verified - Trạng thái xác minh
   * @returns {Promise<Object>}
   */
  static async verifyTechnician(id, verified) {
    const { data, error } = await supabase
      .from('users')
      .update({
        is_verified: verified,
        skill_verified: verified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('role', 'technician')
      .select('id, email, full_name, role, is_verified, skill_verified')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Kiểm tra email đã tồn tại chưa
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  static async emailExists(email) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (error && error.code === 'PGRST116') return false;
    if (error) throw error;
    return !!data;
  }

  /**
   * Kiểm tra số điện thoại đã tồn tại chưa
   * @param {string} phone
   * @returns {Promise<boolean>}
   */
  static async phoneExists(phone) {
    if (!phone) return false;
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (error && error.code === 'PGRST116') return false;
    if (error) throw error;
    return !!data;
  }
}

module.exports = User;
