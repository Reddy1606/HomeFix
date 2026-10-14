const express = require('express');
const router = express.Router();
const { getServices, getCategories, getServiceById } = require('../controllers/serviceController');
const validate = require('../middlewares/validate');
const { listServicesValidation, serviceIdValidation } = require('../validators/serviceValidator');

// ==================== PUBLIC ROUTES (không cần đăng nhập) ====================

// GET /api/services - Danh sách dịch vụ (lọc, tìm kiếm, phân trang)
router.get('/', listServicesValidation, validate, getServices);

// GET /api/services/categories - Danh mục dịch vụ
// (phải khai báo TRƯỚC '/:id' để "categories" không bị hiểu là một id)
router.get('/categories', getCategories);

// GET /api/services/:id - Chi tiết dịch vụ
router.get('/:id', serviceIdValidation, validate, getServiceById);

module.exports = router;
