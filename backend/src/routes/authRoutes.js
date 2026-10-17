const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
  becomeTechnician,
} = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
} = require('../validators/authValidator');

// ==================== PUBLIC ROUTES ====================

// POST /api/auth/register - Đăng ký tài khoản (hỗ trợ role customer hoặc technician)
router.post('/register', registerValidation, register);

// POST /api/auth/login - Đăng nhập
router.post('/login', loginValidation, login);

// ==================== PRIVATE ROUTES (JWT required) ====================

// GET /api/auth/me - Lấy thông tin user hiện tại
router.get('/me', authenticate, getMe);

// PUT /api/auth/me - Cập nhật thông tin cá nhân
router.put('/me', authenticate, updateProfileValidation, updateMe);

// POST /api/auth/change-password - Đổi mật khẩu
router.post('/change-password', authenticate, changePasswordValidation, changePassword);

// POST /api/auth/become-technician - Đăng ký nâng cấp tài khoản thành Thợ sửa chữa
router.post('/become-technician', authenticate, becomeTechnician);

module.exports = router;
