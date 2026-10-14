# 🏠 HomeFix Backend API

> Backend API cho nền tảng gọi thợ sửa chữa tại nhà - EXE101

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Authentication:** JWT + bcrypt
- **Validation:** express-validator

## 📁 Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js     # Kết nối Supabase
│   │   └── env.js          # Biến môi trường
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── database/
│   │   └── migration.sql   # Script tạo bảng
│   ├── middlewares/
│   │   ├── authMiddleware.js   # Xác thực JWT
│   │   ├── roleMiddleware.js   # Phân quyền role
│   │   └── errorHandler.js     # Xử lý lỗi
│   ├── models/
│   │   ├── User.js
│   │   ├── Service.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   └── helpers.js
│   ├── validators/
│   │   └── authValidator.js
│   └── app.js              # Entry point
├── .env
├── .env.example
└── package.json
```

## 🚀 Cài đặt & Chạy

### 1. Cài dependencies

```bash
cd backend
npm install
```

### 2. Cấu hình Supabase

1. Tạo project trên [supabase.com](https://supabase.com)
2. Vào **Settings > API** để lấy:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Vào **Settings > Database** để lấy:
   - `DATABASE_URL` (Connection string)
4. Cập nhật file `.env` với các giá trị trên

### 3. Tạo Database

1. Vào **Supabase Dashboard > SQL Editor**
2. Copy nội dung file `src/database/migration.sql`
3. Chạy script để tạo 3 bảng + dữ liệu mẫu

### 4. Chạy server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server chạy tại: `http://localhost:5000`

## 📋 API Endpoints

### Public (Không cần đăng nhập)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập |

### Private (Cần JWT Token)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/auth/me` | Thông tin user hiện tại |
| PUT | `/api/auth/me` | Cập nhật profile |
| POST | `/api/auth/change-password` | Đổi mật khẩu |

### Admin Only (Cần JWT + role admin)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/admin/users` | Danh sách users |
| GET | `/api/admin/users/:id` | Chi tiết user |
| PUT | `/api/admin/users/:id/verify` | Xác minh thợ |

## 🔑 Tài khoản Admin mặc định

- **Email:** `admin@homefix.vn`
- **Password:** `Admin@123`

## 📮 Test với Postman

1. Import file collection (nếu có) hoặc tạo mới
2. Tạo biến `{{base_url}}` = `http://localhost:5000`
3. Khi login thành công, copy `token` vào header:
   ```
   Authorization: Bearer <token>
   ```
