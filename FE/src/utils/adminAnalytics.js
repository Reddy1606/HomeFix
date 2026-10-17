export const BUSY_STATUSES = ['confirmed', 'in_progress', 'warranty_claim'];
export const STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'warranty_claim'];
export class AdminDataError extends Error {}

// Read all pages before publishing totals. Missing pages must never look like zero revenue.
export async function collectPages(fetchPage, key, options = {}) {
  const rows = new Map();
  let page = 1;
  let expectedTotal;
  while (true) {
    options.signal?.throwIfAborted();
    const data = await fetchPage({ page, limit: 100 }, options);
    const pagination = data?.pagination;
    const totalPages = pagination?.totalPages ?? pagination?.total_pages;
    const total = pagination?.total;
    if (!Array.isArray(data?.[key]) || !pagination ||
        !Number.isSafeInteger(total) || total < 0 ||
        !Number.isSafeInteger(totalPages) || totalPages < 0 ||
        (total > 0 && totalPages < page)) {
      throw new AdminDataError('Dữ liệu phân trang chưa đầy đủ. Vui lòng tải lại.');
    }
    if (expectedTotal !== undefined && expectedTotal !== total) {
      throw new AdminDataError('Danh sách vừa thay đổi. Vui lòng tải lại để cập nhật số liệu.');
    }
    expectedTotal = total;
    for (const row of data[key]) {
      if (!row.id || rows.has(row.id)) {
        throw new AdminDataError('Danh sách vừa thay đổi. Vui lòng tải lại để cập nhật số liệu.');
      }
      rows.set(row.id, row);
    }
    if (page >= totalPages) break;
    if (!data[key].length) throw new AdminDataError('Thiếu dữ liệu phân trang. Vui lòng tải lại.');
    page += 1;
  }
  if (rows.size !== expectedTotal) throw new AdminDataError('Thiếu dữ liệu phân trang. Vui lòng tải lại.');
  return [...rows.values()];
}

export function availableTechnicians(users, bookings) {
  const busy = new Set(bookings.filter((b) => BUSY_STATUSES.includes(b.status))
    .map((b) => b.technician_id || b.technician?.id).filter(Boolean));
  return users.filter((u) => u.role === 'technician' && u.is_active === true &&
    u.is_verified === true && !busy.has(u.id));
}

export function summarizeBookings(bookings) {
  const statusCounts = Object.fromEntries(STATUSES.map((status) => [status, 0]));
  const months = new Map();
  let revenue = 0;
  for (const booking of bookings) {
    statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
    if (booking.status !== 'completed') continue;
    const amount = Number(booking.total_price);
    const date = new Date(booking.created_at);
    if (booking.total_price == null || !Number.isFinite(amount) || amount < 0 ||
        !booking.created_at || Number.isNaN(date.getTime())) {
      throw new AdminDataError('Một số đơn hoàn thành thiếu ngày tạo hoặc giá trị hợp lệ. Chưa thể tổng hợp doanh số.');
    }
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric', month: '2-digit' }).formatToParts(date);
    const month = `${parts.find((p) => p.type === 'year').value}-${parts.find((p) => p.type === 'month').value}`;
    revenue += amount;
    months.set(month, (months.get(month) || 0) + amount);
  }
  return { statusCounts, revenue, commission: Math.round(revenue * 0.15),
    revenueSeries: [...months].sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, revenue: amount, commission: Math.round(amount * 0.15) })) };
}
