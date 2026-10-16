const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, verifyUser, toggleUserStatus } = require('../controllers/userController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require('../controllers/adminServiceController');
const {
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  getDashboardStats,
} = require('../controllers/adminBookingController');
const {
  adminListServicesValidation,
  serviceIdValidation,
  createServiceValidation,
  updateServiceValidation,
} = require('../validators/serviceValidator');
const {
  adminListBookingsValidation,
  bookingIdValidation,
  updateBookingStatusValidation,
} = require('../validators/bookingValidator');

// Tất cả routes dưới đây yêu cầu: đăng nhập + role admin
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/admin/dashboard - Thống kê tổng quan nền tảng
router.get('/dashboard', getDashboardStats);

// GET /api/admin/users - Danh sách users (có phân trang, filter role, tìm kiếm)
router.get('/users', getAllUsers);

// GET /api/admin/users/:id - Chi tiết 1 user
router.get('/users/:id', getUserById);

// PUT /api/admin/users/:id/verify - Xác minh thợ (KYC)
router.put('/users/:id/verify', verifyUser);

// PUT /api/admin/users/:id/status - Khóa / mở khóa tài khoản
router.put('/users/:id/status', toggleUserStatus);

// ==================== QUẢN LÝ DỊCH VỤ ====================

// GET /api/admin/services - Danh sách dịch vụ (gồm cả dịch vụ đã ẩn)
router.get('/services', adminListServicesValidation, validate, getAllServices);

// POST /api/admin/services - Tạo dịch vụ mới
router.post('/services', createServiceValidation, validate, createService);

// GET /api/admin/services/:id - Chi tiết dịch vụ
router.get('/services/:id', serviceIdValidation, validate, getServiceById);

// PUT / PATCH /api/admin/services/:id - Cập nhật dịch vụ
router.put('/services/:id', updateServiceValidation, validate, updateService);
router.patch('/services/:id', updateServiceValidation, validate, updateService);

// DELETE /api/admin/services/:id - Ngừng cung cấp dịch vụ (xóa mềm)
router.delete('/services/:id', serviceIdValidation, validate, deleteService);

// ==================== QUẢN LÝ ĐƠN ĐẶT LỊCH ====================

// GET /api/admin/bookings - Tất cả đơn (lọc theo status, khách, thợ, ngày...)
router.get('/bookings', adminListBookingsValidation, validate, getAllBookings);

// GET /api/admin/bookings/:id - Chi tiết đơn kèm thông tin khách & thợ
router.get('/bookings/:id', bookingIdValidation, validate, getBookingById);

// PUT / PATCH /api/admin/bookings/:id/status - Cập nhật trạng thái đơn (kèm gán thợ)
router.put('/bookings/:id/status', updateBookingStatusValidation, validate, updateBookingStatus);
router.patch('/bookings/:id/status', updateBookingStatusValidation, validate, updateBookingStatus);

module.exports = router;
