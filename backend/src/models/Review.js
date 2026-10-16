const { supabase } = require('../config/database');

/**
 * Review Model - Quản lý đánh giá và nhận xét của khách hàng sau khi hoàn tất sửa chữa
 * Tương ứng bảng reviews trong PostgreSQL / Supabase
 */
class Review {
  /**
   * Tạo đánh giá mới
   * @param {Object} reviewData - { booking_id, rating, comment }
   * @returns {Promise<Object>}
   */
  static async create(reviewData) {
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Tìm đánh giá theo booking_id
   * @param {string} bookingId
   * @returns {Promise<Object|null>}
   */
  static async findByBookingId(bookingId) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error && error.code === 'PGRST116') return null; // Không tìm thấy
    if (error) throw error;
    return data;
  }

  /**
   * Tìm đánh giá theo ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  }
}

module.exports = Review;
