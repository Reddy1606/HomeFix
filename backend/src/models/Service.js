const { supabase } = require('../config/database');

/**
 * Service Model - Quản lý danh mục dịch vụ sửa chữa
 * Theo đề án: bảng giá niêm yết công khai, bảo hành 7-30 ngày
 */
class Service {
  /**
   * Tạo dịch vụ mới (Admin)
   * @param {Object} serviceData
   * @returns {Promise<Object>}
   */
  static async create(serviceData) {
    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Lấy tất cả dịch vụ đang active
   * @param {Object} options - { category }
   * @returns {Promise<Array>}
   */
  static async findAll({ category = null } = {}) {
    let query = supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  /**
   * Tìm dịch vụ theo ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }
}

module.exports = Service;
