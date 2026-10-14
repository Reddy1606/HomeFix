/**
 * Tiện ích ngày giờ theo múi giờ Việt Nam (UTC+7).
 * Server deploy (Render...) chạy giờ UTC nên không dùng ngày local của server
 * để tính hạn bảo hành hay lọc theo ngày.
 */
const VN_OFFSET_HOURS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Ngày hiện tại ở Việt Nam, cộng thêm offsetDays ngày, dạng 'YYYY-MM-DD'
 * (khớp cột DATE trong PostgreSQL)
 */
const vnDateString = (offsetDays = 0) => {
  const vnNow = new Date(Date.now() + VN_OFFSET_HOURS * 3600 * 1000);
  return new Date(vnNow.getTime() + offsetDays * DAY_MS).toISOString().slice(0, 10);
};

/**
 * Chuyển giá trị from/to từ query thành mốc thời gian ISO.
 * - 'YYYY-MM-DD' được hiểu là ngày theo giờ VN (from: 00:00:00, to: 23:59:59.999)
 * - ISO có múi giờ được giữ nguyên
 * @param {string} value
 * @param {'start'|'end'} edge
 * @returns {string} ISO string (UTC)
 */
const toRangeBoundary = (value, edge) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const time = edge === 'start' ? '00:00:00.000' : '23:59:59.999';
    return new Date(`${value}T${time}+07:00`).toISOString();
  }
  return new Date(value).toISOString();
};

module.exports = { vnDateString, toRangeBoundary };
