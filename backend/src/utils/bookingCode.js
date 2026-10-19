/**
 * Tiện ích định dạng Mã đơn dịch vụ HomeFix (Phương án 2):
 * - Đơn thường: FIX-DDMM-XXXX
 * - Đơn VIP / Bảo dưỡng theo gói: VIP-DDMM-XXXX
 */

function formatBookingCode(booking) {
  if (!booking) return 'FIX-0000-0000';

  const isObj = typeof booking === 'object' && booking !== null;
  const rawId = isObj ? String(booking.id || '') : String(booking);
  if (!rawId) return 'FIX-0000-0000';

  const clean = rawId.replace(/[^a-zA-Z0-9]/g, '');
  const suffix = (clean.length >= 8 ? clean.slice(4, 8) : clean.slice(0, 4)).toUpperCase() || '0000';

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

module.exports = {
  formatBookingCode,
};
