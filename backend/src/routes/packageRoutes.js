const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const {
  getPackages,
  getMySubscription,
  subscribePackage,
  cancelSubscription,
  adminGetPackages,
  adminUpdatePackage,
  adminGetSubscriptions,
} = require('../controllers/packageController');

// 1. Tuyến đường công khai (Khách, Thợ, Khách vãng lai xem bảng giá các gói)
router.get('/', getPackages);

// 2. Tuyến đường Khách hàng (User đã đăng nhập)
router.get('/my-subscription', authenticate, authorize('customer'), getMySubscription);
router.post('/subscribe', authenticate, authorize('customer'), subscribePackage);
router.post('/cancel', authenticate, authorize('customer'), cancelSubscription);

// 3. Tuyến đường Quản trị viên (Admin)
router.get('/admin/list', authenticate, authorize('admin'), adminGetPackages);
router.put('/admin/:id', authenticate, authorize('admin'), adminUpdatePackage);
router.get('/admin/subscriptions', authenticate, authorize('admin'), adminGetSubscriptions);

module.exports = router;
