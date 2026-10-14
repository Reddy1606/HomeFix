const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, verifyUser } = require('../controllers/userController');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');

// Tất cả routes dưới đây yêu cầu: đăng nhập + role admin
router.use(authenticate);
router.use(authorize('admin'));

// GET /api/admin/users - Danh sách users (có phân trang, filter role)
router.get('/users', getAllUsers);

// GET /api/admin/users/:id - Chi tiết 1 user
router.get('/users/:id', getUserById);

// PUT /api/admin/users/:id/verify - Xác minh thợ
router.put('/users/:id/verify', verifyUser);

module.exports = router;
