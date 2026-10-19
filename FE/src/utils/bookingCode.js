/**
 * Tiện ích định dạng Mã đơn dịch vụ HomeFix theo chuẩn Phương án 2:
 * - Đơn thường: FIX-DDMM-XXXX (Ví dụ: FIX-1910-3182)
 * - Đơn VIP / Bảo dưỡng theo gói: VIP-DDMM-XXXX (Ví dụ: VIP-1910-3182)
 */

export function formatBookingCode(booking) {
  if (!booking) return 'FIX-0000-0000';

  const isObj = typeof booking === 'object' && booking !== null;
  const rawId = isObj ? String(booking.id || '') : String(booking);
  if (!rawId) return 'FIX-0000-0000';

  // Lấy 4 ký tự nhận diện gọn gàng (vị trí 4..8 của UUID, ví dụ e80b3182 -> 3182)
  const clean = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const suffix = (clean.length >= 8 ? clean.slice(4, 8) : clean.slice(0, 4)).toUpperCase() || '0000';

  // Lấy ngày tháng DDMM
  let datePart = '';
  const dateVal = isObj ? (booking.created_at || booking.createdAt || booking.scheduled_at) : null;
  const dateObj = dateVal ? new Date(dateVal) : new Date();
  if (!isNaN(dateObj.getTime())) {
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    datePart = `${day}${month}`;
  } else {
    const now = new Date();
    datePart = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  // Xác định đơn VIP hay FIX
  const isVip = isObj && Boolean(
    booking.is_priority === true ||
    (booking.priority_level && Number(booking.priority_level) > 0) ||
    booking.subscription_id ||
    booking.is_vip === true ||
    (typeof booking.description === 'string' && (booking.description.includes('VIP') || booking.description.includes('BẢO DƯỠNG THEO GÓI')))
  );

  const prefix = isVip ? 'VIP' : 'FIX';
  return `${prefix}-${datePart}-${suffix}`;
}

export default formatBookingCode;
