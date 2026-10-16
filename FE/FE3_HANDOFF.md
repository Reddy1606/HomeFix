# HomeFix – Bàn giao Frontend 3

## Nền tảng và phạm vi

- Dựa trên `Reddy1606/HomeFix`, nhánh `feature/fe1-home-services`, commit `fc84047336c8064be4ecb37aa943bcdf467f52b3`.
- Đã đối chiếu 12 slide HomeFix và checklist FE3.1–FE3.11 trong cuộc trò chuyện được chia sẻ.
- Giữ React, Vite, Tailwind, React Router và Axios của FE1; không đổi backend.
- Đặt lịch `/booking` vẫn là màn hình chờ thuộc FE2.

## Chạy trên máy của bạn

Yêu cầu Node.js phù hợp Vite 8 (dùng Node 22.12+ hoặc Node 24 LTS).

1. Tạo nhánh FE3 từ nhánh FE1 đã cung cấp:

```bash
git fetch origin
git switch -c feature/fe3-auth-admin origin/feature/fe1-home-services
```

2. Chép thư mục `FE` trong gói bàn giao vào thư mục gốc repo, đồng ý thay thế file. Gói không chứa `.env`, `node_modules` hay `dist`.
   Nếu đã có thay đổi riêng hoặc code FE2, hãy commit/stash trước rồi so sánh các file tích hợp `App.jsx`, `Header.jsx`, `api/client.js`, `package.json`; không ghi đè thay đổi của nhóm.
   Gói cũng có `HomeFix_FE3.patch`, dùng thay cho bước chép file trên đúng commit gốc:

```bash
git apply --check HomeFix_FE3.patch
git apply HomeFix_FE3.patch
```

3. Mở terminal trong thư mục FE:

```bash
cd FE
npm ci
```

4. Tạo `FE/.env` từ `.env.example` và điền URL API:

```env
VITE_API_URL=http://localhost:5000/api
```

5. Chạy backend đã được nhóm cấu hình trong một terminal riêng theo `backend/README.md`, rồi chạy frontend:

```bash
npm run dev
```

Mở URL Vite in ra trên terminal, thường là `http://localhost:5173`. Sau mỗi lần sửa `.env`, khởi động lại Vite. Nếu đổi cổng frontend, backend phải cho phép origin đó qua CORS. Không đặt Supabase service-role key hay JWT secret trong FE.

## Các màn hình đã triển khai

| Đường dẫn | Nội dung |
|---|---|
| `/login` | Email, mật khẩu, hiển thị lỗi, hiện/ẩn mật khẩu, chống gửi trùng |
| `/register` | Họ tên, email, số điện thoại Việt Nam, mật khẩu và xác nhận |
| `/profile` | Xem/cập nhật hồ sơ, đổi mật khẩu, đăng xuất |
| `/admin` | Tổng số đơn, đơn chờ, đơn hoàn thành, tổng dịch vụ, đơn gần đây |
| `/admin/bookings` | Danh sách, tìm kiếm/lọc, phân trang, chi tiết và cập nhật trạng thái |
| `/admin/services` | Danh sách, tìm kiếm/lọc, phân trang, thêm/sửa/ẩn/hiện dịch vụ |

Tài khoản Admin do backend seed: `admin@homefix.vn` / `Admin@123`. FE không tự tạo hay giả lập phiên Admin. Chỉ dùng khi database của nhóm đã được cấu hình và seed.

## Tích hợp Auth đã khớp backend hiện tại

| Method | Endpoint | Payload / Kết quả |
|---|---|---|
| POST | `/auth/register` | `{ full_name, email, phone, password, role: 'customer' }` → `data: { user, token }` |
| POST | `/auth/login` | `{ email, password }` → `data: { user, token }` |
| GET | `/auth/me` | → `data: { user }` |
| PUT | `/auth/me` | `{ full_name, phone, address }` → `data: { user }` |
| POST | `/auth/change-password` | `{ current_password, new_password }` |

- Giữ token ở `localStorage['token']` theo quy ước nhóm; request gửi `Authorization: Bearer <token>`.
- Khôi phục phiên qua `/auth/me`, không tin role từ dữ liệu tự ghi trong localStorage.
- Customer truy cập `/admin` nhận thông báo không có quyền; không gọi API quản trị.
- `/auth/me` lỗi mạng/5xx: giữ token, hiện nút thử lại; token hết hạn/không hợp lệ: xóa phiên và về đăng nhập.
- Sai mật khẩu hiện tại khi đổi mật khẩu không tự đăng xuất.
- Đăng xuất hiện xóa phiên trên trình duyệt. Backend hiện chưa có endpoint thu hồi token.
- Backend phải tiếp tục kiểm tra JWT và quyền admin; route guard chỉ bảo vệ điều hướng phía FE.

## Hợp đồng Admin cần Backend 2 hoàn thiện

**Nhánh backend được cung cấp chưa có các endpoint dưới đây.** FE đã viết lớp gọi API theo đề xuất từ checklist, nhưng chưa thể xác nhận kết nối đầu cuối với dữ liệu thật. Không có dữ liệu mẫu tự động thay thế trong trang Admin. Khi backend trả 404, FE thông báo chức năng chưa sẵn sàng; lỗi mạng/4xx/5xx không được coi là lưu thành công.

Mọi đường dẫn bên dưới nối sau `VITE_API_URL`; tất cả cần `authenticate` và quyền admin.

| Method | Endpoint | Nội dung |
|---|---|---|
| GET | `/admin/dashboard` | Thống kê tổng quan |
| GET | `/admin/bookings?page=1&limit=10&status=pending&search=...` | Đơn hàng, tìm theo mã/tên/SĐT; bỏ filter khi trống |
| PATCH | `/admin/bookings/:id/status` | `{ status }` |
| GET | `/admin/services?page=1&limit=10&category=...&search=...&is_active=false` | **Cần thêm** để Admin lấy cả dịch vụ đã ẩn; `/services` công khai chỉ có dịch vụ active |
| POST | `/admin/services` | Tạo dịch vụ |
| PATCH | `/admin/services/:id` | Sửa dịch vụ hoặc `{ is_active: false }` để ẩn |

Envelope thành công: `{ success: true, data: ... }`. Lỗi: `{ success: false, message, errors?: [{field, message}] }` cùng HTTP status phù hợp.

Dashboard `data`:

```json
{
  "total_bookings": 12,
  "pending_bookings": 4,
  "completed_bookings": 8,
  "total_services": 10,
  "status_counts": { "pending": 4, "confirmed": 0, "in_progress": 0, "completed": 8, "cancelled": 0, "warranty_claim": 0 },
  "recent_bookings": []
}
```

Danh sách đơn `data`: `{ bookings: [...], pagination: { page, limit, total, totalPages } }`.
Danh sách dịch vụ `data`: `{ services: [...], pagination: { page, limit, total, totalPages } }`.
`totalPages` giữ cách viết của pagination đang có trong backend `/admin/users`.

Booking gồm các trường đang có trong DB: `id`, `status`, `booking_type`, `scheduled_at`, `address`, `description`, `total_price`, `warranty_until`, `created_at`, cùng `services: { name }`. Thông tin khách có thể trả bằng `contact_name`, `contact_phone` hoặc join `users: { full_name, phone }`.

Payload dịch vụ: `{ name, category, description, base_price, price_unit, warranty_days, is_active }`.
`category` dùng tên tiếng Việt từ FE1: `Điện lạnh`, `Điện nước`, `Thiết bị gia dụng`, `Đồ gỗ nội thất`; `price_unit`: `per_job`, `per_hour`, `per_month`. Không gửi `image_url` vì schema backend hiện chưa có cột này.

Luồng cập nhật đơn: pending → confirmed/cancelled; confirmed → in_progress/cancelled; in_progress → completed/cancelled. completed/cancelled không được mở lại qua UI. `warranty_claim` được hiển thị/lọc theo schema, chưa có quy trình xử lý bảo hành trong phạm vi FE3. Backend vẫn phải quyết định và kiểm tra chuyển trạng thái hợp lệ.

Chỗ đổi endpoint/adapter khi BE2 thống nhất khác: `src/api/admin.js`. Không cần sửa từng trang.

## Tích hợp với FE2

`useAuth` được export từ `src/context/auth.js`; `AuthProvider` đã bọc toàn bộ ứng dụng. FE2 có thể bọc route đặt lịch trong `ProtectedRoute`. Guard giữ `location` trong `state.from`; đăng nhập xong trở về cả query string và hash. Hoặc chuyển sang `/login?redirect=/booking?serviceId=...` với giá trị redirect được URL-encode.

Trong `App.jsx`, thay riêng màn hình chờ `/booking` bằng component FE2. FE3 không tạo lịch sử đặt lịch hay thay logic nghiệp vụ FE2.

## Kiểm chứng

```bash
npm test
npm run lint
npm run build
```

- 4 kiểm thử tự động: đầu số/độ dài điện thoại, độ mạnh mật khẩu, redirect nội bộ, dữ liệu hồ sơ.
- Đã chạy 10 nhóm kiểm thử trình duyệt với API mô phỏng: guard guest/customer, lỗi đăng nhập, đăng ký, khôi phục phiên, hồ sơ, lỗi đổi mật khẩu, dashboard, cập nhật đơn, thêm/ẩn dịch vụ, lỗi mutation, API Admin chưa có và mobile.
- Không có lỗi JavaScript runtime trong các luồng trên; đã xem giao diện desktop và điện thoại 390px.
- Lint còn 2 cảnh báo có sẵn ở `src/pages/Services.jsx` và `src/pages/ServiceDetail.jsx` của FE1; không có lỗi lint và không phát sinh cảnh báo mới trong phần FE3.
- **Chưa chạy kiểm thử với Supabase/backend thật** vì chưa có cấu hình môi trường và BE2 Admin API. Cần nhóm kiểm thử tiếp trước khi tích hợp/publish.
- Chưa commit, push hoặc tạo PR. Trước khi commit/push, chạy thêm `npm test` trong `backend/` theo nội quy nhóm.

Commit summary gợi ý: `feat(fe3): add authentication, profile and admin dashboard`.
