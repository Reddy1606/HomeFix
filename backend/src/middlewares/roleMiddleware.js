/**
 * Middleware phân quyền theo role
 * Sử dụng sau middleware authenticate
 *
 * Ví dụ:
 *   authorize('admin')             → chỉ admin
 *   authorize('customer', 'admin') → customer hoặc admin
 *   authorize('technician')        → chỉ thợ
 *
 * @param  {...string} allowedRoles - Danh sách role được phép truy cập
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Đảm bảo đã chạy authenticate middleware trước
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập trước.',
      });
    }

    // Kiểm tra role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bạn không có quyền truy cập. Yêu cầu role: ${allowedRoles.join(' hoặc ')}.`,
      });
    }

    next();
  };
};

module.exports = authorize;
