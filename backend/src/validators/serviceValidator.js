const { body, param, query } = require('express-validator');

/**
 * Validation rules cho API Dịch vụ (Services)
 * Lưu ý (Express 5): req.query không ghi đè được, nên chỉ kiểm tra ở đây,
 * việc ép kiểu (parseInt...) làm trong controller.
 */

const SORT_VALUES = ['category', 'price_asc', 'price_desc', 'name', 'newest'];

const idParam = param('id').isUUID().withMessage('ID dịch vụ không hợp lệ.');

const pagingQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page phải là số nguyên >= 1.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit phải từ 1 đến 100.'),
];

// GET /api/services
const listServicesValidation = [
  ...pagingQuery,
  query('category').optional().isString().isLength({ max: 100 }).withMessage('category tối đa 100 ký tự.'),
  query('search').optional().isString().isLength({ max: 100 }).withMessage('Từ khóa tìm kiếm tối đa 100 ký tự.'),
  query('min_price').optional().isInt({ min: 0 }).withMessage('min_price phải là số nguyên >= 0.'),
  query('max_price').optional().isInt({ min: 0 }).withMessage('max_price phải là số nguyên >= 0.'),
  query('sort').optional().isIn(SORT_VALUES).withMessage(`sort phải là một trong: ${SORT_VALUES.join(', ')}.`),
];

// GET /api/services/:id, GET/DELETE /api/admin/services/:id
const serviceIdValidation = [idParam];

// GET /api/admin/services
const adminListServicesValidation = [
  ...listServicesValidation,
  query('is_active').optional().isIn(['true', 'false']).withMessage('is_active phải là true hoặc false.'),
];

// Các rule dùng chung cho tạo/sửa. required = true khi tạo mới
const serviceFields = (required) => {
  const opt = (chain) => (required ? chain : chain.optional());
  return [
    opt(body('name'))
      .trim()
      .isLength({ min: 2, max: 200 })
      .withMessage('Tên dịch vụ phải từ 2-200 ký tự.'),
    opt(body('category'))
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Danh mục không được để trống (tối đa 100 ký tự).'),
    opt(body('base_price'))
      .isInt({ min: 0, max: 1000000000 })
      .withMessage('Giá cơ bản phải là số nguyên VNĐ từ 0 đến 1.000.000.000.'),
    body('description').optional({ values: 'null' }).isString().isLength({ max: 2000 })
      .withMessage('Mô tả tối đa 2000 ký tự.'),
    body('price_unit').optional().isString().trim().isLength({ min: 1, max: 50 })
      .withMessage('Đơn vị giá tối đa 50 ký tự.'),
    body('warranty_days').optional().isInt({ min: 0, max: 365 })
      .withMessage('Số ngày bảo hành phải từ 0 đến 365.'),
    body('is_active').optional().isBoolean()
      .withMessage('is_active phải là true hoặc false.'),
  ];
};

// POST /api/admin/services
const createServiceValidation = serviceFields(true);

// PUT /api/admin/services/:id (cập nhật từng phần)
const updateServiceValidation = [idParam, ...serviceFields(false)];

module.exports = {
  listServicesValidation,
  serviceIdValidation,
  adminListServicesValidation,
  createServiceValidation,
  updateServiceValidation,
};
