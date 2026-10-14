const { supabase } = require('../config/database');

// Các kiểu sắp xếp cho phép (whitelist - không cho client truyền tên cột tùy ý)
const SORT_OPTIONS = {
  category: [['category', true], ['name', true]],
  price_asc: [['base_price', true], ['name', true]],
  price_desc: [['base_price', false], ['name', true]],
  name: [['name', true]],
  newest: [['created_at', false]],
};

/**
 * Loại bỏ ký tự đặc biệt của cú pháp PostgREST filter (, ( ) % * \)
 * để chuỗi tìm kiếm không phá vỡ câu truy vấn .or()
 */
const sanitizeSearch = (text) => String(text).replace(/[,()%*\\]/g, ' ').trim();

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
   * Lấy danh sách dịch vụ (có lọc, tìm kiếm, sắp xếp, phân trang)
   * Mặc định chỉ lấy dịch vụ đang active (dùng cho khách hàng).
   * Admin truyền includeInactive = true hoặc isActive = true/false.
   *
   * @param {Object} options - { category, search, minPrice, maxPrice, sort,
   *                             includeInactive, isActive, page, limit }
   * @returns {Promise<{ services: Array, total: number }>}
   */
  static async findAll({
    category = null,
    search = null,
    minPrice = null,
    maxPrice = null,
    sort = 'category',
    includeInactive = false,
    isActive = null,
    page = 1,
    limit = 50,
  } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('services').select('*', { count: 'exact' });

    if (isActive !== null) {
      query = query.eq('is_active', isActive);
    } else if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (category) query = query.eq('category', category);
    if (minPrice !== null) query = query.gte('base_price', minPrice);
    if (maxPrice !== null) query = query.lte('base_price', maxPrice);

    const keyword = search ? sanitizeSearch(search) : '';
    if (keyword) {
      query = query.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    const orders = SORT_OPTIONS[sort] || SORT_OPTIONS.category;
    for (const [column, ascending] of orders) {
      query = query.order(column, { ascending });
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;
    return { services: data, total: count };
  }

  /**
   * Danh sách danh mục (chỉ tính dịch vụ đang active) kèm số lượng dịch vụ
   * @returns {Promise<Array<{ category: string, total: number }>>}
   */
  static async getCategories() {
    const { data, error } = await supabase
      .from('services')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    const counts = {};
    for (const row of data) {
      counts[row.category] = (counts[row.category] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => a.category.localeCompare(b.category, 'vi'));
  }

  /**
   * Tìm dịch vụ theo ID (không lọc is_active - controller tự quyết định)
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

  /**
   * Cập nhật dịch vụ (Admin)
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>} null nếu không tìm thấy
   */
  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('services')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }
}

module.exports = Service;
