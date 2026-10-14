const { validationResult } = require('express-validator');

/**
 * Middleware gom lỗi từ express-validator và trả về đúng API Contract:
 * { success: false, message, errors: [{ field, message }] }
 * Đặt sau mảng validator, trước controller.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  return res.status(400).json({
    success: false,
    message: 'Dữ liệu không hợp lệ.',
    errors: result.array().map((e) => ({ field: e.path, message: e.msg })),
  });
};

module.exports = validate;
