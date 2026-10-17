const multer = require('multer');

// Sử dụng memoryStorage để lấy buffer của file
// Dễ dàng tải trực tiếp lên Supabase Storage hoặc lưu vào ổ đĩa khi cần
const storage = multer.memoryStorage();

// Giới hạn dung lượng: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Danh sách mimetype hợp lệ
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf',
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Định dạng tệp không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP hoặc PDF.');
    error.status = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

module.exports = upload;
