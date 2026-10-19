const { supabase } = require('../config/database');
const { formatBookingCode } = require('../utils/bookingCode');

// Thông tin dịch vụ đi kèm mỗi booking
const SERVICE_FIELDS = 'services(name, category, description, base_price, price_unit, warranty_days)';

// Thông tin khách + thợ (bảng bookings có 2 khóa ngoại tới users nên phải chỉ rõ cột)
const USER_FIELDS =
  'customer:users!customer_id(id, full_name, email, phone), ' +
  'technician:users!technician_id(id, full_name, phone, rating_avg)';

const WITH_SERVICE = `*, ${SERVICE_FIELDS}`;
const WITH_ALL = `*, ${SERVICE_FIELDS}, ${USER_FIELDS}`;

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
    const customFields = ['is_priority', 'priority_level', 'is_warranty_claim', 'subscription_id'];
    const safeData = { ...bookingData };

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([safeData])
        .select(WITH_SERVICE)
        .single();

      const isMissingColumn = (err) =>
        err && (err.code === 'PGRST204' || err.code === '42703' || String(err.message).includes('column') || String(err.message).includes('is_priority'));

      if (!error && data) {
        const result = {
          ...data,
          is_priority: bookingData.is_priority || false,
          priority_level: bookingData.priority_level || 0,
          is_warranty_claim: bookingData.is_warranty_claim || false,
        };
        result.booking_code = formatBookingCode(result);
        return result;
      }
      if (error && !isMissingColumn(error)) throw error;
    } catch (err) {
      const isMissingCol = err && (err.code === 'PGRST204' || err.code === '42703' || String(err.message).includes('column') || String(err.message).includes('is_priority'));
      if (!isMissingCol) throw err;
    }

    // Nếu Supabase chưa có cột mới (42703), loại bỏ các cột custom rồi insert
    customFields.forEach((field) => delete safeData[field]);
    const { data, error } = await supabase
      .from('bookings')
      .insert([safeData])
      .select(WITH_SERVICE)
      .single();

    if (error) throw error;
    const fallbackResult = {
      ...data,
      is_priority: bookingData.is_priority || false,
      priority_level: bookingData.priority_level || 0,
      is_warranty_claim: bookingData.is_warranty_claim || false,
    };
    fallbackResult.booking_code = formatBookingCode(fallbackResult);
    return fallbackResult;
  }

  /**
   * Tìm booking theo ID
   * @param {string} id
   * @param {Object} options - { withUsers } true: kèm thông tin khách & thợ (dùng cho Admin)
   * @returns {Promise<Object|null>}
   */
  static async findById(id, { withUsers = false } = {}) {
    const { data, error } = await supabase
      .from('bookings')
      .select(withUsers ? WITH_ALL : WITH_SERVICE)
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;

    if (data) {
      const Review = require('./Review');
      const rev = await Review.findByBookingId(id);
      if (rev) data.reviews = rev;
      
      const isDescPriority = typeof data.description === 'string' && (data.description.includes('ƯU TIÊN') || data.description.includes('VIP'));
      const isDescWarranty = typeof data.description === 'string' && data.description.includes('BẢO HÀNH');
      data.is_priority = data.is_priority === true || isDescPriority;
      data.priority_level = data.priority_level || (isDescPriority ? 2 : 0);
      data.is_warranty_claim = data.is_warranty_claim === true || isDescWarranty || data.status === 'warranty_claim';
      data.booking_code = formatBookingCode(data);
    }

    return data;
  }

  /**
   * Lấy danh sách bookings của customer (lịch sử đặt lịch)
   * @param {string} customerId
   * @param {Object} options - { status, page, limit }
   * @returns {Promise<{ bookings: Array, total: number }>}
   */
  static async findByCustomer(customerId, { status = null, page = 1, limit = 20 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('bookings')
      .select(`*, ${SERVICE_FIELDS}`, { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    if (Array.isArray(data)) {
      const Review = require('./Review');
      await Promise.all(
        data.map(async (b) => {
          const rev = await Review.findByBookingId(b.id);
          if (rev) b.reviews = rev;
          const isDescPriority = typeof b.description === 'string' && (b.description.includes('ƯU TIÊN') || b.description.includes('VIP'));
          const isDescWarranty = typeof b.description === 'string' && b.description.includes('BẢO HÀNH');
          b.is_priority = b.is_priority === true || isDescPriority;
          b.priority_level = b.priority_level || (isDescPriority ? 2 : 0);
          b.is_warranty_claim = b.is_warranty_claim === true || isDescWarranty || b.status === 'warranty_claim';
          b.booking_code = formatBookingCode(b);
        })
      );
    }

    return { bookings: data, total: count };
  }

  /**
   * Lấy tất cả bookings (Admin & Thợ) - lọc theo trạng thái, khách, thợ, loại đặt, khoảng ngày tạo
   * Ưu tiên xếp các đơn VIP lên đầu danh sách!
   */
  static async findAll({
    status = null,
    customerId = null,
    technicianId = null,
    bookingType = null,
    from = null,
    to = null,
    page = 1,
    limit = 20,
  } = {}) {
    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;

    let query = supabase
      .from('bookings')
      .select(WITH_ALL, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(rangeFrom, rangeTo);

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);
    if (technicianId) query = query.eq('technician_id', technicianId);
    if (bookingType) query = query.eq('booking_type', bookingType);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error, count } = await query;
    if (error) throw error;

    const enriched = (data || []).map((b) => {
      const isDescPriority = typeof b.description === 'string' && (b.description.includes('ƯU TIÊN') || b.description.includes('VIP'));
      const isDescWarranty = typeof b.description === 'string' && b.description.includes('BẢO HÀNH');
      const item = {
        ...b,
        is_priority: b.is_priority === true || isDescPriority,
        priority_level: b.priority_level || (isDescPriority ? 2 : 0),
        is_warranty_claim: b.is_warranty_claim === true || isDescWarranty || b.status === 'warranty_claim',
      };
      item.booking_code = formatBookingCode(item);
      return item;
    });

    // Sắp xếp đơn VIP ưu tiên lên trước
    enriched.sort((a, b) => {
      const pA = a.is_priority ? 1 : 0;
      const pB = b.is_priority ? 1 : 0;
      if (pA !== pB) return pB - pA;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return { bookings: enriched, total: count };
  }

  /**
   * Cập nhật booking.
   * expectedStatus: chỉ cập nhật nếu booking vẫn đang ở trạng thái này
   * (tránh 2 người cùng đổi trạng thái một lúc, ghi đè lẫn nhau).
   *
   * @param {string} id
   * @param {Object} updateData
   * @param {Object} options - { expectedStatus }
   * @returns {Promise<Object|null>} null nếu không có dòng nào khớp điều kiện
   */
  static async update(id, updateData, { expectedStatus = null } = {}) {
    let query = supabase
      .from('bookings')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (expectedStatus) {
      query = query.eq('status', expectedStatus);
    }

    const { data, error } = await query.select(WITH_ALL).single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    if (data) {
      data.booking_code = formatBookingCode(data);
    }
    return data;
  }

  /**
   * Tính toán doanh thu, hoa hồng và thống kê trạng thái đơn cho Dashboard
   * Hoa hồng nền tảng: 15% trên các đơn đã hoàn thành (completed)
   * @returns {Promise<Object>}
   */
  static async getRevenueAndStatusStats() {
    // Lấy toàn bộ đơn hàng (id, status, total_price, commission_rate, created_at)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, status, total_price, commission_rate, created_at');

    if (error) throw error;

    const allBookings = bookings || [];
    const total_bookings = allBookings.length;

    // Đếm số đơn theo từng trạng thái
    const status_counts = {
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      warranty_claim: 0,
    };

    let total_revenue = 0; // Tổng doanh thu các đơn hoàn thành
    let total_commission = 0; // Doanh thu hoa hồng HomeFix 15%

    for (const b of allBookings) {
      if (status_counts[b.status] !== undefined) {
        status_counts[b.status]++;
      }

      if (b.status === 'completed') {
        const price = Number(b.total_price) || 0;
        const rate = b.commission_rate !== null && b.commission_rate !== undefined ? Number(b.commission_rate) : 0.15;
        total_revenue += price;
        total_commission += Math.round(price * rate);
      }
    }

    return {
      total_bookings,
      status_counts,
      pending_bookings: status_counts.pending,
      completed_bookings: status_counts.completed,
      revenue: {
        total_revenue,
        commission_rate: 0.15,
        total_commission,
        technician_payout: total_revenue - total_commission,
      },
    };
  }
}

module.exports = Booking;
