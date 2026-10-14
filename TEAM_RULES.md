# 🛡️ HOMEFIX - NỘI QUY LÀM VIỆC & QUY TẮC DỰ ÁN (TEAM RULES)

> Tài liệu quy chuẩn kỹ thuật và phối hợp nhóm môn **EXE101 - Khởi nghiệp đổi mới sáng tạo**  
> Dự án: **HomeFix - Nền tảng gọi thợ sửa chữa gia đình theo yêu cầu**

---

## 📌 PHẦN 1: QUY TẮC GIT WORKFLOW (CHỐNG CONFLICT & MẤT CODE)

### 1. Tuyệt đối KHÔNG code và push trực tiếp trên nhánh `main`
* Nhánh `main` chỉ chứa code đã chạy ổn định và đã test thành công.
* Mỗi thành viên **bắt buộc tạo nhánh riêng** theo cú pháp:
  * Frontend 1: `git checkout -b feature/fe1-home-services`
  * Frontend 2: `git checkout -b feature/fe2-booking-management`
  * Frontend 3: `git checkout -b feature/fe3-auth-admin`
  * Backend 2: `git checkout -b feature/be2-services-booking`

### 2. Quy trình làm việc hàng ngày (Daily Git Routine)
Trước khi bắt đầu code mỗi ngày hoặc trước khi chuẩn bị tạo Pull Request:
```bash
# 1. Chuyển về nhánh main và kéo code mới nhất của cả nhóm về
git checkout main
git pull origin main

# 2. Chuyển lại về nhánh của mình và cập nhật code mới từ main sang
git checkout feature/ten-nhanh-cua-ban
git merge main

# 3. Code xong, thêm commit và push lên GitHub
git add .
git commit -m "feat(fe2): hoàn thiện giao diện form đặt lịch"
git push origin feature/ten-nhanh-cua-ban
```

### 3. Quy chuẩn viết Commit Message (Conventional Commits)
Không viết commit vô nghĩa như: `fix`, `update`, `asdasd`, `xong`. Viết theo format:
* `feat(...)`: Thêm tính năng mới (Ví dụ: `feat(be2): api tạo đơn đặt lịch`)
* `fix(...)`: Sửa lỗi (Ví dụ: `fix(fe3): sửa lỗi không lưu token sau khi login`)
* `style(...)`: Chỉnh sửa CSS/Giao diện (Ví dụ: `style(fe1): căn giữa nút đặt thợ`)
* `docs(...)`: Cập nhật tài liệu/README (Ví dụ: `docs: cập nhật postman collection`)

### 4. BẢO MẬT: Nghiêm cấm Commit File Bí Mật
* **Tuyệt đối không commit file `.env`** chứa `SUPABASE_SERVICE_ROLE_KEY` hoặc mật khẩu lên GitHub.
* Luôn kiểm tra `git status` trước khi `git add .`. Nếu thấy file `.env` xuất hiện màu đỏ/xanh, phải kiểm tra lại `.gitignore` ngay lập tức!
* Không bao giờ commit thư mục `node_modules/` hay thư mục `build/`, `dist/`.

---

## 🔌 PHẦN 2: QUY CHUẨN KẾT NỐI API (API CONTRACT)

Để Frontend 1, 2, 3 và Backend 1, 2 không bị cãi nhau về định dạng dữ liệu:

### 1. Cấu trúc Response chuẩn (Bắt buộc Backend tuân thủ)
Tất cả API trả về JSON phải theo đúng định dạng này:

**Khi Thành công (HTTP 200, 201):**
```json
{
  "success": true,
  "message": "Mô tả ngắn gọn kết quả",
  "data": { ... }
}
```

**Khi Thất bại (HTTP 400, 401, 403, 404, 409, 500):**
```json
{
  "success": false,
  "message": "Câu thông báo lỗi hiển thị được lên màn hình",
  "errors": [
    { "field": "email", "message": "Email đã tồn tại" }
  ]
}
```

### 2. Quy chuẩn Token & Header
* Mọi API cần bảo mật (Profile, Tạo booking, Xem lịch sử, Admin) bắt buộc Frontend phải gắn header:
  ```
  Authorization: Bearer <access_token>
  ```
* Frontend nên lưu token trong `localStorage.setItem('token', res.data.token)`.

### 3. Quy ước đặt tên
* **Database & JSON API:** Dùng `snake_case` (ví dụ: `full_name`, `base_price`, `booking_type`, `created_at`).
* **JavaScript / React:** Biến và hàm dùng `camelCase` (ví dụ: `handleSubmit`, `userProfile`).
* **Component React:** Dùng `PascalCase` (ví dụ: `ServiceCard.jsx`, `BookingModal.jsx`).

---

## 📋 PHẦN 3: CHECKLIST NHIỆM VỤ CHI TIẾT TỪNG THÀNH VIÊN

### 🎨 Frontend 1: Giao diện trang chủ & Dịch vụ
- [ ] **Mobile-first:** Giao diện bắt buộc phải xem đẹp trên điện thoại (vì khách gọi thợ phần lớn bằng smartphone).
- [ ] **Bảng giá minh bạch:** Hiển thị rõ giá từng dịch vụ (lấy từ API Backend 2 hoặc dữ liệu mẫu ban đầu).
- [ ] **Không hardcode URL API:** Đặt biến môi trường `VITE_API_URL` hoặc `REACT_APP_API_URL = http://localhost:5000/api`.
- [ ] Có hiệu ứng Loading (Skeleton hoặc Spinner) khi đang tải danh sách dịch vụ.

### 📅 Frontend 2: Đặt lịch & Quản lý đơn hàng
- [ ] **Chống spam click:** Khi khách bấm nút "Xác nhận đặt lịch", lập tức **disable nút** và hiển thị "Đang xử lý..." để khách không bấm nhiều lần tạo đơn trùng lặp.
- [ ] **Kiểm tra đăng nhập:** Nếu khách chưa đăng nhập mà bấm "Đặt lịch", tự động điều hướng sang trang Đăng nhập và sau đó quay lại trang đặt.
- [ ] Hiển thị rõ các trạng thái đơn:
  * 🟡 `pending` (Chờ điều phối thợ)
  * 🔵 `confirmed` (Thợ đang đến)
  * 🟢 `completed` (Hoàn thành - kích hoạt bảo hành)
  * 🔴 `cancelled` (Đã hủy)

### 💻 Frontend 3: Tài khoản & Dashboard Admin
- [ ] Form Đăng ký bắt buộc validate số điện thoại Việt Nam 10 số (đầu `03, 05, 07, 08, 09`).
- [ ] Phân quyền giao diện (Route Guard): Nếu user có `role === 'customer'` mà cố tình gõ link `/admin` thì phải đá về trang chủ hoặc thông báo "Không có quyền".
- [ ] Sử dụng tài khoản Admin mặc định để test Dashboard:
  * **Email:** `admin@homefix.vn`
  * **Password:** `Admin@123`

### 🔧 Backend 2: Services, Booking & Deployment
- [ ] Kế thừa 100% cấu trúc thư mục của **Backend 1** (không tạo lại server mới từ đầu).
- [ ] Sử dụng lại model [Service.js](file:///c:/FPT/7/EXE101/HomeFix/backend/src/models/Service.js) và [Booking.js](file:///c:/FPT/7/EXE101/HomeFix/backend/src/models/Booking.js) đã có sẵn.
- [ ] Tái sử dụng middleware `authenticate` và `authorize('admin')` từ [authMiddleware.js](file:///c:/FPT/7/EXE101/HomeFix/backend/src/middlewares/authMiddleware.js) cho các route đặt lịch và quản trị đơn.
- [ ] Luôn chạy `npm test` trước khi commit để đảm bảo code mới không làm hỏng tính năng Auth đã có.
- [ ] Chuẩn bị deploy backend lên Render.com hoặc Railway.app để các bạn Frontend kết nối online.

---

## 🚨 PHẦN 4: NGUYÊN TẮC GIẢI QUYẾT KHI GẶP LỖI (CONFLICT RESOLUTION)

1. Khi gặp lỗi **Git Merge Conflict**:
   * **Bình tĩnh, không xóa bừa code của bạn khác.**
   * Mở file bị conflict trong VS Code, xem kỹ phần `<<<<<<< HEAD` (code của mình) và `>>>>>>> main` (code của bạn mình).
   * Thảo luận trực tiếp với người viết đoạn code đó trước khi bấm nút "Accept Incoming" hoặc "Accept Current".
2. Khi API backend trả về lỗi:
   * Frontend chụp màn hình tab **Network (F12)** gồm: Request URL, Payload gửi lên, và Response trả về gửi cho Backend.
   * Backend kiểm tra log console terminal để xác định nguyên nhân.
