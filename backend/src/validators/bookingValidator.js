const { body, param, query } = require('express-validator');
const { BOOKING_STATUSES } = require('../utils/bookingStatus');

/**
 * Validation rules cho API Đặt lịch (Bookings)
 */

const BOOKING_TYPES = ['immediate', 'scheduled'];

// Thời gian phải kèm múi giờ (Z hoặc +07:00) để tránh lệch giờ giữa máy khách và server
const ISO_WITH_TZ = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

// Đơn hẹn giờ phải đặt trước tối thiểu 30 phút
const MIN_LEAD_MINUTES = 30;

const idParam = param('id').isUUID().withMessage('ID đơn đặt lịch không hợp lệ.');

const pagingQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page phải là số nguyên >= 1.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit phải từ 1 đến 100.'),
];

// POST /api/bookings
const createBookingValidation = [
  body('service_id').isUUID().withMessage('service_id không hợp lệ.'),

  body('booking_type')
    .optional()
    .isIn(BOOKING_TYPES)
    .withMessage('booking_type phải là "immediate" hoặc "scheduled".'),

  body('scheduled_at').custom((value, { req }) => {
    if (req.body.booking_type !== 'scheduled') return true; // đặt tức thì: bỏ qua

    if (!value) {
      throw new Error('Vui lòng chọn thời gian hẹn cho đơn đặt lịch hẹn giờ.');
    }
    if (typeof value !== 'string' || !ISO_WITH_TZ.test(value) || isNaN(new Date(value).getTime())) {
      throw new Error('scheduled_at phải theo chuẩn ISO 8601 kèm múi giờ (VD: 2026-10-20T09:00:00+07:00).');
    }
    if (new Date(value).getTime() < Date.now() + MIN_LEAD_MINUTES * 60 * 1000) {
      throw new Error(`Thời gian hẹn phải sau thời điểm hiện tại ít nhất ${MIN_LEAD_MINUTES} phút.`);
    }
    return true;
  }),

  body('address')
    .isString().withMessage('Địa chỉ không hợp lệ.')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Địa chỉ phải từ 5-500 ký tự.'),

  body('description')
    .optional({ values: 'null' })
    .isString().withMessage('Mô tả không hợp lệ.')
    .isLength({ max: 1000 })
    .withMessage('Mô tả sự cố tối đa 1000 ký tự.'),
];

// GET /api/bookings/:id, PUT /api/bookings/:id/cancel, GET /api/admin/bookings/:id
const bookingIdValidation = [idParam];

// GET /api/bookings/my
const listMyBookingsValidation = [
  ...pagingQuery,
  query('status').optional().isIn(BOOKING_STATUSES).withMessage(`status phải là một trong: ${BOOKING_STATUSES.join(', ')}.`),
];

const dateQuery = (name) =>
  query(name)
    .optional()
    .custom((value) => {
      const ok = typeof value === 'string' && (DATE_ONLY.test(value) || ISO_WITH_TZ.test(value)) && !isNaN(new Date(value).getTime());
      if (!ok) throw new Error(`${name} phải có dạng YYYY-MM-DD hoặc ISO 8601 kèm múi giờ.`);
      return true;
    });

// GET /api/admin/bookings
const adminListBookingsValidation = [
  ...listMyBookingsValidation,
  query('customer_id').optional().isUUID().withMessage('customer_id không hợp lệ.'),
  query('technician_id').optional().isUUID().withMessage('technician_id không hợp lệ.'),
  query('booking_type').optional().isIn(BOOKING_TYPES).withMessage('booking_type phải là "immediate" hoặc "scheduled".'),
  dateQuery('from'),
  dateQuery('to'),
];

// PUT /api/admin/bookings/:id/status
const updateBookingStatusValidation = [
  idParam,
  body('status')
    .isIn(BOOKING_STATUSES)
    .withMessage(`status phải là một trong: ${BOOKING_STATUSES.join(', ')}.`),
  body('technician_id').optional().isUUID().withMessage('technician_id không hợp lệ.'),
];

module.exports = {
  BOOKING_TYPES,
  DATE_ONLY,
  createBookingValidation,
  bookingIdValidation,
  listMyBookingsValidation,
  adminListBookingsValidation,
  updateBookingStatusValidation,
};
