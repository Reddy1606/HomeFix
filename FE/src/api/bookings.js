import apiClient from './client';

/**
 * Tạo đơn đặt lịch mới (Customer)
 * @param {Object} payload { service_id, booking_type, scheduled_at, address, description }
 */
export async function createBooking(payload) {
  const { data } = await apiClient.post('/bookings', payload);
  return data.data?.booking || data.data;
}

/**
 * Lấy lịch sử đặt lịch của khách hàng đang đăng nhập
 * @param {Object} params { status, page, limit }
 */
export async function fetchMyBookings(params = {}) {
  const { data } = await apiClient.get('/bookings/my', { params });
  return data.data; // { bookings: [...], pagination: {...} }
}

/**
 * Lấy chi tiết đơn đặt lịch theo ID
 * @param {string} id
 */
export async function fetchBookingById(id) {
  const { data } = await apiClient.get(`/bookings/${id}`);
  return data.data?.booking || data.data;
}

/**
 * Hủy đơn đặt lịch (khi đang ở trạng thái pending hoặc confirmed)
 * @param {string} id
 * @param {string} [reason]
 */
export async function cancelBooking(id, reason = '') {
  const { data } = await apiClient.put(`/bookings/${id}/cancel`, { reason });
  return data.data?.booking || data.data;
}
