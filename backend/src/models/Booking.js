const { supabase } = require('../config/database');

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
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select(WITH_SERVICE)
      .single();

    if (error) throw error;
    return data;
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
    return { bookings: data, total: count };
  }

  /**
   * Lấy tất cả bookings (Admin) - lọc theo trạng thái, khách, thợ, loại đặt, khoảng ngày tạo
   * @param {Object} options - { status, customerId, technicianId, bookingType, from, to, page, limit }
   *                           from/to là chuỗi ISO (mốc thời gian đã tính múi giờ)
   * @returns {Promise<{ bookings: Array, total: number }>}
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
    return { bookings: data, total: count };
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
    return data;
  }
}

module.exports = Booking;
