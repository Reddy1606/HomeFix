const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const authenticate = require('../middlewares/authMiddleware');
const authorize = require('../middlewares/roleMiddleware');
const {
  uploadAvatar,
  uploadKYC,
  uploadServiceImage,
} = require('../controllers/uploadController');

// Mọi route upload đều bắt buộc đăng nhập
router.use(authenticate);

// POST /api/upload/avatar - Cập nhật ảnh đại diện người dùng
router.post('/avatar', upload.single('file'), uploadAvatar);

// POST /api/upload/kyc - Upload hồ sơ KYC thợ (CCCD, lý lịch tư pháp)
router.post('/kyc', authorize('technician'), upload.single('file'), uploadKYC);

// POST /api/upload/service-image - Upload ảnh dịch vụ (Admin)
router.post('/service-image', authorize('admin'), upload.single('file'), uploadServiceImage);

module.exports = router;
