# 🏠 HomeFix - Nền Tảng Gọi Thợ Sửa Chữa Tại Nhà Theo Yêu Cầu

> **Đề án Khởi nghiệp đổi mới sáng tạo (EXE101) - Đại học FPT**  
> **Slogan:** *"An tâm về thợ - Minh bạch về giá - Tiện lợi mọi lúc"*

---

## 📌 1. TÀI LIỆU QUAN TRỌNG CHO NHÓM (BẮT BUỘC ĐỌC)

* 🛡️ **[TEAM_RULES.md](./TEAM_RULES.md):** Quy tắc làm việc nhóm, Git Workflow chống conflict, chuẩn API Contract và Checklist nhiệm vụ từng người.
* ⚙️ **[Backend README](./backend/README.md):** Hướng dẫn cài đặt, chạy backend và danh sách API.
* 📮 **[Postman Collection](./backend/HomeFix_Backend1_Postman_Collection.json):** Bộ test API hoàn chỉnh dùng cho Frontend ghép nối và kiểm thử.
* 🗄️ **[Database Migration](./backend/src/database/migration.sql):** Schema 3 bảng `users`, `services`, `bookings` trên Supabase.

---

## 👥 2. PHÂN CÔNG NHIỆM VỤ DỰ ÁN

| Thành viên | Nhiệm vụ | Trọng tâm bàn giao |
|---|---|---|
| **Frontend 1** | Giao diện Trang chủ & Dịch vụ | Layout chung, Trang chủ, Danh sách & Chi tiết dịch vụ, Responsive. |
| **Frontend 2** | Đặt lịch & Quản lý đơn hàng | Form đặt lịch, Trang lịch sử đặt lịch, Theo dõi trạng thái đơn hàng. |
| **Frontend 3** | Tài khoản & Dashboard Admin | Đăng nhập/Đăng ký, Trang cá nhân, Dashboard Admin quản lý dịch vụ và đơn. |
| **Backend 1** | Authentication & Database | Cấu trúc Express, Supabase DB (3 bảng), API Auth & Profile, JWT, RBAC. *(Hoàn thành ✅)* |
| **Backend 2** | Services, Booking & Deployment | API Dịch vụ, API Đặt lịch, API Admin quản trị đơn, Deploy backend thử nghiệm. |

---

## 🚀 3. HƯỚNG DẪN CHẠY BACKEND NHANH

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt thư viện
npm install

# 3. Tạo file .env từ mẫu và điền Supabase Key
cp .env.example .env

# 4. Chạy kiểm thử tự động
npm test

# 5. Khởi động server
npm run dev
```

Server chạy tại: `http://localhost:5000`
