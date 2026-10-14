# 🏠 HomeFix Backend API

> Backend API cho nền tảng gọi thợ sửa chữa tại nhà - EXE101

---

## 🌐 SẢN PHẨM CHẠY TRÊN ĐÂU? (KIẾN TRÚC VẬN HÀNH)

Hệ thống **HomeFix** được xây dựng theo mô hình **Client - Server hiện đại trên nền tảng Cloud**, chia làm 3 tầng:

```mermaid
graph TD
    A["📱 Khách hàng & Thợ (Web Mobile)"] -->|Gửi REST API Request| C["⚙️ Express.js Backend Server<br/>(Node.js, JWT, Bcrypt)"]
    B["💻 Ban Quản Trị HomeFix (Admin PC)"] -->|Gửi REST API Request| C
    C -->|Truy vấn SQL & Kiểm tra JWT| D[("🐘 PostgreSQL Database<br/>(Supabase Cloud - Region Singapore)")]
```

### 1. Môi trường phát triển (Development / Local):
* **Backend API:** Chạy cục bộ trên máy tính lập trình viên thông qua Node.js (cổng `http://localhost:5000`).
* **Cơ sở dữ liệu:** Lưu trữ trực tiếp trên **PostgreSQL Cloud của Supabase** (Region Singapore). Lợi thế: Tất cả thành viên trong nhóm (Frontend 1, 2, 3 và Backend 2) đều dùng chung một nguồn dữ liệu thật qua Internet, không cần cài đặt PostgreSQL nặng máy.

### 2. Môi trường thử nghiệm & Báo cáo đề tài (Production / Staging):
* **Frontend:** Triển khai trên **Vercel** hoặc **Netlify** (VD: `https://homefix.vercel.app`).
* **Backend:** Triển khai trên **Render.com** hoặc **Railway.app** (VD: `https://homefix-api.onrender.com`).
* **Database:** Giữ nguyên trên **Supabase PostgreSQL** (đảm bảo dữ liệu demo của giảng viên và nhóm được lưu trữ 24/7).
* **Thiết bị người dùng cuối:** Chạy dưới dạng **Web App chuẩn Responsive**, tối ưu trải nghiệm trên mọi kích thước màn hình (iPhone, Android, Tablet, Laptop).

---

## 🛠️ Tech Stack Chi Tiết

| Thành phần | Công nghệ | Phiên bản | Mục đích |
|---|---|---|---|
| **Runtime** | Node.js | v20+ / v24 | Môi trường thực thi JavaScript phía server |
| **Framework** | Express.js | v5 | Xây dựng RESTful API |
| **Database** | **PostgreSQL** | v15+ (Supabase) | Cơ sở dữ liệu quan hệ lưu trữ Users, Services, Bookings |
| **Bảo mật** | Helmet, CORS, bcryptjs, JWT | - | Mã hóa mật khẩu, tạo token xác thực, bảo vệ header HTTP |
| **Kiểm tra dữ liệu** | express-validator | v7 | Kiểm tra format email, sđt Việt Nam, độ mạnh mật khẩu |

---

## 📁 Cấu trúc thư mục Source Code

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js     # Kết nối Supabase PostgreSQL
│   │   └── env.js          # Nạp biến môi trường
│   ├── controllers/
│   │   ├── authController.js   # Xử lý đăng ký, đăng nhập, profile
│   │   └── userController.js   # Xử lý quản trị users cho admin
│   ├── database/
│   │   └── migration.sql   # DDL script tạo 3 bảng chuẩn PostgreSQL
│   ├── middlewares/
│   │   ├── authMiddleware.js   # Bắt & giải mã Bearer JWT
│   │   ├── roleMiddleware.js   # Phân quyền customer / admin
│   │   └── errorHandler.js     # Bắt lỗi toàn cục
│   ├── models/
│   │   ├── User.js         # Truy vấn bảng users
│   │   ├── Service.js      # Truy vấn bảng services
│   │   └── Booking.js      # Truy vấn bảng bookings
│   ├── routes/
│   │   ├── authRoutes.js   # Router /api/auth
│   │   └── adminRoutes.js  # Router /api/admin
│   ├── test/
│   │   └── testAuth.js     # Bộ test tự động 7 kịch bản
│   ├── utils/
│   │   └── helpers.js      # Hàm băm mật khẩu, ký token
│   ├── validators/
│   │   └── authValidator.js# Quy tắc kiểm tra dữ liệu đầu vào
│   └── app.js              # Entry point Express App
├── HomeFix_Backend1_Postman_Collection.json # File import Postman
├── .env                    # Biến môi trường bí mật (KHÔNG commit)
├── .env.example            # Mẫu cấu hình môi trường
└── package.json
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY TỪNG BƯỚC

### Bước 1: Chuẩn bị Cơ sở dữ liệu (Có 2 lựa chọn)

#### 🔹 Cách 1: Dùng PostgreSQL trên Cloud Supabase (KHUYÊN DÙNG CHO CẢ NHÓM)
1. Đăng ký tài khoản miễn phí tại [supabase.com](https://supabase.com).
2. Tạo project mới (chọn Region `Singapore`).
3. Vào mục **SQL Editor**, dán toàn bộ file `src/database/migration.sql` và nhấn **Run**.
4. Vào mục **Project Settings > API**, copy `Project URL` và `service_role key`.

#### 🔹 Cách 2: Dùng PostgreSQL Cài Trên Máy Cục Bộ (Local pgAdmin / Docker)
1. Cài đặt PostgreSQL trên máy tính (cổng mặc định 5432).
2. Mở công cụ **pgAdmin 4** (hoặc DBeaver), tạo database mới tên là `homefix`.
3. Mở Query Tool, dán nội dung file `src/database/migration.sql` và nhấn Execute (F5).
4. Điền connection string vào biến `DATABASE_URL` trong file `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/homefix
   ```

---

### Bước 2: Cấu hình biến môi trường (`.env`)

Tạo file `.env` nằm trong thư mục `backend/` với nội dung:
```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=homefix-jwt-secret-key-dev-2026
JWT_EXPIRES_IN=7d
```

---

### Bước 3: Cài đặt thư viện & Chạy kiểm thử tự động

```bash
# 1. Cài đặt các package cần thiết
npm install

# 2. Chạy bộ kiểm thử tự động 7/7 test cases
npm test
```

Nếu màn hình hiện:
```
==================================================
   🧪 BẮT ĐẦU KIỂM THỬ HOMEFIX BACKEND 1 API     
==================================================
✅ [PASS] GET /api/health - Healthcheck server
✅ [PASS] POST /api/auth/login - Đăng nhập Admin thành công
✅ [PASS] POST /api/auth/register - Đăng ký Customer mới
✅ [PASS] POST /api/auth/register - Chặn đăng ký trùng Email (HTTP 409)
✅ [PASS] GET /api/auth/me - Lấy thông tin cá nhân qua JWT
✅ [PASS] RBAC Phân quyền - Chặn Customer truy cập Admin Route (HTTP 403 Forbidden)
✅ [PASS] RBAC Phân quyền - Cho phép Admin xem danh sách Users (HTTP 200 OK)
--------------------------------------------------
Kết quả: 7 Passed | 0 Failed
==================================================
```
👉 **Hệ thống đã hoạt động hoàn hảo và sẵn sàng!**

---

### Bước 4: Khởi chạy Server

```bash
# Chế độ phát triển (tự động reload khi sửa code)
npm run dev

# Chế độ thông thường
npm start
```

API Server sẽ lắng nghe tại: `http://localhost:5000`

---

## 📋 DANH SÁCH API ENDPOINTS

### 1. Public Routes (Không yêu cầu đăng nhập)
* `GET  /api/health` - Kiểm tra tình trạng server
* `POST /api/auth/register` - Đăng ký tài khoản (Customer / Technician)
* `POST /api/auth/login` - Đăng nhập nhận JWT Token

### 2. Private Routes (Yêu cầu Header `Authorization: Bearer <token>`)
* `GET  /api/auth/me` - Xem thông tin người dùng đang đăng nhập
* `PUT  /api/auth/me` - Cập nhật thông tin cá nhân (Họ tên, SĐT, địa chỉ, avatar)
* `POST /api/auth/change-password` - Đổi mật khẩu

### 3. Admin Only Routes (Yêu cầu Token có quyền `admin`)
* `GET  /api/admin/users` - Lấy danh sách tất cả người dùng (hỗ trợ phân trang `?page=1&limit=10&role=technician`)
* `GET  /api/admin/users/:id` - Xem chi tiết 1 người dùng kèm hồ sơ KYC
* `PUT  /api/admin/users/:id/verify` - Phê duyệt / Hủy phê duyệt thợ sửa chữa

---

### 4. Dịch vụ (Public - Backend 2)
* `GET  /api/services` - Danh sách dịch vụ (lọc `category`, `search`, `min_price`, `max_price`, `sort`, `page`, `limit`)
* `GET  /api/services/categories` - Danh mục dịch vụ kèm số lượng
* `GET  /api/services/:id` - Chi tiết dịch vụ

### 5. Đặt lịch (Customer - Backend 2)
* `POST /api/bookings` - Tạo đơn đặt lịch (tức thì / hẹn giờ)
* `GET  /api/bookings/my` - Lịch sử đặt lịch (lọc `status`, phân trang)
* `GET  /api/bookings/:id` - Chi tiết & trạng thái đơn (khách xem đơn của mình, admin xem mọi đơn)
* `PUT  /api/bookings/:id/cancel` - Khách tự hủy đơn (khi `pending` / `confirmed`)

### 6. Admin quản trị (Backend 2)
* `GET|POST /api/admin/services`, `GET|PUT|DELETE /api/admin/services/:id` - Quản lý dịch vụ (DELETE = ẩn dịch vụ)
* `GET  /api/admin/bookings` - Danh sách đơn (lọc `status`, `customer_id`, `technician_id`, `booking_type`, `from`, `to`)
* `GET  /api/admin/bookings/:id` - Chi tiết đơn kèm khách & thợ
* `PUT  /api/admin/bookings/:id/status` - Cập nhật trạng thái đơn, gán thợ

📘 Chi tiết request/response: **[API_BACKEND2.md](./API_BACKEND2.md)**
🧪 Postman: **[HomeFix_Backend2_Postman_Collection.json](./HomeFix_Backend2_Postman_Collection.json)**
🚀 Deploy lên Render: **[DEPLOYMENT.md](./DEPLOYMENT.md)**

---

## 🌱 DỮ LIỆU DEMO

```bash
npm run seed
```
Thêm 8 dịch vụ, 2 khách hàng, 2 thợ đã xác minh và 8 đơn đặt lịch đủ các trạng thái. Chạy lại nhiều lần không bị nhân đôi dữ liệu.

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@homefix.vn` | `Admin@123` |
| Khách hàng | `khach1@homefix.vn`, `khach2@homefix.vn` | `Customer@123` |
| Thợ | `tho1@homefix.vn`, `tho2@homefix.vn` | `Technician@123` |

## 🧪 KIỂM THỬ

```bash
npm test          # chạy cả test Auth (7 case) và test Backend 2
npm run test:be2  # chỉ test Services / Booking / Admin
```
Test chạy trên database thật và để lại một ít dữ liệu test (tài khoản `*@homefix.test`, đơn của họ, 1 dịch vụ `[TEST]` đã ẩn).

---

## 🔑 TÀI KHOẢN ADMIN DEMO CÓ SẴN TRONG DATABASE

* **Email:** `admin@homefix.vn`
* **Mật khẩu:** `Admin@123`
