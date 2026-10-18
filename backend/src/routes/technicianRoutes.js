const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validate');
const { bookingIdValidation } = require('../validators/bookingValidator');
const {
  getAvailableJobs,
  claimJob,
  getMyJobs,
  updateJobStatus,
} = require('../controllers/technicianBookingController');

// Mọi route dưới đây yêu cầu đăng nhập và có role technician
router.use(authenticate);
router.use(authorize('technician'));

// GET /api/technician/jobs/available - Danh sách việc mới đang chờ nhận
router.get('/jobs/available', getAvailableJobs);

// POST /api/technician/jobs/:id/claim - Thợ nhận việc
router.post('/jobs/:id/claim', bookingIdValidation, validate, claimJob);

// GET /api/technician/jobs/my - Danh sách việc đã nhận / được giao của tôi
router.get('/jobs/my', getMyJobs);

// PUT /api/technician/jobs/:id/status - Cập nhật tiến độ (in_progress / completed)
router.put('/jobs/:id/status', bookingIdValidation, validate, updateJobStatus);

module.exports = router;
