const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
} = require('../controllers/bookingController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const {
  createBookingValidation,
  bookingIdValidation,
  listMyBookingsValidation,
} = require('../validators/bookingValidator');

// Tất cả routes dưới đây yêu cầu đăng nhập (JWT)
router.use(authenticate);

// POST /api/bookings - Khách hàng tạo đơn đặt lịch
router.post('/', authorize('customer'), createBookingValidation, validate, createBooking);

// GET /api/bookings/my - Lịch sử đặt lịch của tôi
// (phải khai báo TRƯỚC '/:id' để "my" không bị hiểu là một id)
router.get('/my', authorize('customer'), listMyBookingsValidation, validate, getMyBookings);

// GET /api/bookings/:id - Chi tiết đơn (khách: đơn của mình, admin: mọi đơn)
router.get('/:id', authorize('customer', 'admin'), bookingIdValidation, validate, getBookingById);

// PUT /api/bookings/:id/cancel - Khách tự hủy đơn (khi pending / confirmed)
router.put('/:id/cancel', authorize('customer'), bookingIdValidation, validate, cancelBooking);

module.exports = router;
