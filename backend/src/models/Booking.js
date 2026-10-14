const { supabase } = require('../config/database');

/**
 * Booking Model - Quản lý đơn đặt thợ sửa chữa
 * Hỗ trợ: đặt tức thì / hẹn giờ, tracking trạng thái, bảo hành
 */
class Booking {
  /**
   * Tạo booking mới
   * @param {Object} bookingData
   * @returns {Promise<Object>}
   */
  static async create(bookingData) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select('*, services(name, category, base_price)')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Tìm booking theo ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, services(name, category, base_price, warranty_days)')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }

  /**
   * Lấy danh sách bookings của customer
   * @param {string} customerId
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  static async findByCustomer(customerId, { status = null, page = 1, limit = 20 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('bookings')
      .select('*, services(name, category, base_price)', { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    return { bookings: data, total: count };
  }
}

module.exports = Booking;
