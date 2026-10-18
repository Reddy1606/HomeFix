const { body } = require('express-validator');

/**
 * Validation rules cho các API Authentication
 */

// Validate đăng ký
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ.')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu phải có ít nhất 8 ký tự.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.'),

  body('full_name')
    .notEmpty()
    .withMessage('Họ tên không được để trống.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự.')
    .trim(),

  body('phone')
    .optional()
    .matches(/^(0[3|5|7|8|9])+([0-9]{8})$/)
    .withMessage('Số điện thoại Việt Nam không hợp lệ (VD: 0901234567).'),

  body('role')
    .optional()
    .isIn(['customer', 'technician'])
    .withMessage('Role phải là "customer" hoặc "technician".'),

  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Địa chỉ tối đa 500 ký tự.')
    .trim(),
];

// Validate đăng nhập
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ.')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống.'),
];

// Validate cập nhật profile
const updateProfileValidation = [
  body('full_name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự.')
    .trim(),

  body('phone')
    .optional()
    .matches(/^(0[3|5|7|8|9])+([0-9]{8})$/)
    .withMessage('Số điện thoại Việt Nam không hợp lệ.'),

  body('address')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Địa chỉ tối đa 500 ký tự.')
    .trim(),

  body('avatar_url')
    .optional()
    .isURL()
    .withMessage('Avatar URL không hợp lệ.'),

  body('cccd_number')
    .optional()
    .matches(/^[0-9]{9,12}$/)
    .withMessage('Số CCCD phải từ 9-12 chữ số.')
    .trim(),
];

// Validate đổi mật khẩu
const changePasswordValidation = [
  body('current_password')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được để trống.'),

  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.'),
];

// Validate yêu cầu OTP quên mật khẩu
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ.')
    .normalizeEmail(),
];

// Validate xác thực mã OTP
const verifyOtpValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ.')
    .normalizeEmail(),

  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã OTP phải có đúng 6 chữ số.')
    .isNumeric()
    .withMessage('Mã OTP chỉ bao gồm các chữ số.'),
];

// Validate đặt lại mật khẩu với OTP
const resetPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ.')
    .normalizeEmail(),

  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('Mã OTP phải có đúng 6 chữ số.')
    .isNumeric()
    .withMessage('Mã OTP chỉ bao gồm các chữ số.'),

  body('new_password')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới phải có ít nhất 8 ký tự.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số.'),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
};

