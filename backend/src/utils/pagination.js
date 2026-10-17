/**
 * Tiện ích phân trang dùng chung cho các API danh sách
 */
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Đọc page & limit từ query string (đã được validator kiểm tra)
 * @param {Object} query - req.query
 * @param {number} defaultLimit
 * @returns {{ page: number, limit: number }}
 */
const parsePagination = (query = {}, defaultLimit = DEFAULT_LIMIT) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), MAX_LIMIT);
  return { page, limit };
};

/**
 * Tạo object pagination trả về cho Frontend (snake_case theo API Contract)
 */
const buildPagination = ({ page, limit, total }) => {
  const safeTotal = total || 0;
  const totalPages = Math.ceil(safeTotal / limit);
  return {
    page,
    limit,
    total: safeTotal,
    total_pages: totalPages,
    totalPages,
  };
};

module.exports = { parsePagination, buildPagination, DEFAULT_LIMIT, MAX_LIMIT };
