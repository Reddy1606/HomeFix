export const BOOKING_STATUS = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  warranty_claim: 'Yêu cầu bảo hành',
};

export function dateLabel(value) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Chưa có'
    : new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date);
}
export function money(value) {
  if (value == null) return 'Chưa có';
  const num = typeof value === 'object' ? Number(value?.total_revenue ?? 0) : Number(value);
  return Number.isNaN(num)
    ? 'Chưa có'
    : new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(num);
}
