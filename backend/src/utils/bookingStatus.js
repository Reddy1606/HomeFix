/**
 * Quy tắc chuyển trạng thái của đơn đặt lịch (booking)
 *
 *  pending ──► confirmed ──► in_progress ──► completed ──► warranty_claim
 *     │            │              │              ▲               │
 *     └────────────┴──────────────┴──► cancelled  └───────────────┘
 *
 * Khớp với CHECK constraint của cột bookings.status trong migration.sql
 */
const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'warranty_claim',
];

// Admin được phép chuyển từ trạng thái nào sang trạng thái nào
const ADMIN_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['warranty_claim'],
  warranty_claim: ['in_progress', 'completed'],
  cancelled: [],
};

// Khách hàng chỉ được tự hủy khi thợ chưa bắt đầu làm
const CUSTOMER_CANCELLABLE = ['pending', 'confirmed'];

// Nhãn tiếng Việt để hiển thị trong thông báo lỗi
const STATUS_LABELS = {
  pending: 'Chờ điều phối thợ',
  confirmed: 'Thợ đang đến',
  in_progress: 'Đang sửa chữa',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  warranty_claim: 'Yêu cầu bảo hành',
};

const canTransition = (from, to) => (ADMIN_TRANSITIONS[from] || []).includes(to);

module.exports = {
  BOOKING_STATUSES,
  ADMIN_TRANSITIONS,
  CUSTOMER_CANCELLABLE,
  STATUS_LABELS,
  canTransition,
};
