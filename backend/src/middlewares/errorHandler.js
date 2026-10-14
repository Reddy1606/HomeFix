/**
 * Middleware xử lý lỗi tập trung (Error Handler)
 * Đặt cuối cùng trong chuỗi middleware của Express
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Lỗi validation từ express-validator
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ.',
      errors: err.errors,
    });
  }

  // Lỗi từ Supabase / PostgreSQL
  if (err.code === '23505') {
    // Unique constraint violation
    return res.status(409).json({
      success: false,
      message: 'Dữ liệu đã tồn tại (email hoặc số điện thoại đã được sử dụng).',
    });
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu tham chiếu không tồn tại.',
    });
  }

  // Lỗi chung
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Đã xảy ra lỗi từ server.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware xử lý route không tồn tại (404)
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFound };
