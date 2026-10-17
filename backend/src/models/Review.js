const { supabase } = require('../config/database');

// Bộ nhớ đệm fallback khi bảng reviews chưa được migrate trên cloud database
const memoryReviews = new Map();

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
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select('*')
        .single();

      if (!error && data) {
        memoryReviews.set(reviewData.booking_id, data);
        return data;
      }
    } catch (err) {
      // Fallback khi bảng reviews chưa tồn tại trên Supabase
    }

    const fallbackReview = {
      id: `rev-${Date.now()}`,
      booking_id: reviewData.booking_id,
      rating: Number(reviewData.rating),
      comment: reviewData.comment || null,
      created_at: new Date().toISOString(),
    };
    memoryReviews.set(reviewData.booking_id, fallbackReview);
    return fallbackReview;
  }

  /**
   * Tìm đánh giá theo booking_id
   * @param {string} bookingId
   * @returns {Promise<Object|null>}
   */
  static async findByBookingId(bookingId) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (!error && data) return data;
      if (error && error.code === 'PGRST116') return null; // Không tìm thấy
    } catch (err) {
      // Fallback
    }

    return memoryReviews.get(bookingId) || null;
  }

  /**
   * Tìm đánh giá theo ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) return data;
      if (error && error.code === 'PGRST116') return null;
    } catch (err) {
      // Fallback
    }

    for (const rev of memoryReviews.values()) {
      if (rev.id === id) return rev;
    }
    return null;
  }
}

module.exports = Review;
