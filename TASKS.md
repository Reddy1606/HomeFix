# 📋 KẾ HOẠCH & BẢNG PHÂN CHIA NHIỆM VỤ DỰ ÁN HOMEFIX (GIAI ĐOẠN 2)

> **Mục tiêu:** Hoàn thiện toàn bộ luồng tính năng thực tế từ Khách hàng → Thợ → Admin, sẵn sàng cho buổi demo & bảo vệ Đề án Khởi nghiệp **EXE101 (Đại học FPT)**.

---

## 🟢 TÌNH TRẠNG HIỆN TẠI (ĐÃ HOÀN THÀNH Ở GIAI ĐOẠN 1)

- [x] **Backend 1:** Database PostgreSQL (Supabase Cloud), Auth JWT, Đăng ký/Đăng nhập, Phân quyền RBAC (Customer, Technician, Admin).
- [x] **Backend 2:** API CRUD Dịch vụ, API Đặt lịch (Tức thì / Hẹn giờ), API Quản trị đơn & Gán thợ, 70/70 Automated Tests Pass.
- [x] **Frontend:** Tích hợp giao diện Trang chủ (FE1), Đặt lịch & Lịch sử đơn (FE2), Đăng nhập/Đăng ký & Admin Dashboard (FE3).
- [x] **Tích hợp:** Đã merge toàn bộ vào nhánh chung `develop` và kết nối API thực tế.

---

## 🎯 BẢNG PHÂN CÔNG NHIỆM VỤ CHI TIẾT GIAI ĐOẠN 2

| Thành viên / Vai trò | Nhiệm vụ trọng tâm | Chi tiết kỹ thuật & Tiêu chí hoàn thành | Độ ưu tiên |
| :--- | :--- | :--- | :---: |
| **Backend 1**<br/>*(Auth & Database)* | **1. Upload ảnh & Media Storage** | - Tích hợp Supabase Storage và Local Storage fallback.<br/>- API upload ảnh đại diện (avatar) người dùng.<br/>- API upload ảnh CCCD / chứng chỉ nghề thợ phục vụ duyệt KYC. | ✅ Đã hoàn thành |
| **Backend 2**<br/>*(Services & Bookings)* | **2. API Đánh giá & Phản hồi (Reviews)**<br/>**3. API Doanh thu & Hoa hồng** | - Bảng `reviews` (booking_id, rating 1-5 sao, comment, created_at).<br/>- API `POST /api/bookings/:id/review` (đánh giá sau khi completed).<br/>- Tính toán doanh thu hoa hồng 15% và tỷ lệ đơn vào API Dashboard. | ✅ Đã hoàn thành |
| **Frontend 1**<br/>*(Trang chủ & Dịch vụ)* | **4. Nâng cấp Bộ lọc & Tìm kiếm**<br/>**5. Luồng liên kết đặt lịch nhanh** | - Ô tìm kiếm tức thì theo từ khóa tại trang `/services`.<br/>- Bộ lọc khoảng giá (min - max) và danh mục linh hoạt.<br/>- Nút "Đặt lịch ngay" trên Service Card & Detail truyền thẳng `?serviceId=...`. | 🟡 Đang hoàn thiện |
| **Frontend 2**<br/>*(Đặt lịch & Khách hàng)* | **6. Đánh giá & Phản hồi thợ**<br/>**7. Toast Notification & UX** | - Modal chấm điểm sao và nhận xét thợ tại trang chi tiết đơn hoàn thành.<br/>- Toast thông báo nổi (`ToastContext`) toàn diện khi thao tác.<br/>- Tích hợp gọi API review tự động. | ✅ Đã hoàn thành |
| **Frontend 3**<br/>*(Admin & Dashboard)* | **8. Modal điều phối chọn thợ**<br/>**9. Biểu đồ thống kê doanh thu** | - `TechnicianPicker` modal chọn thợ trực tiếp tại Admin Bookings.<br/>- `DashboardCharts` biểu đồ thanh doanh thu và biểu đồ tròn trạng thái đơn.<br/>- Quản lý tài khoản Admin Users. | ✅ Đã hoàn thành |
| **DevOps / QA Tester**<br/>*(Kiểm thử & Triển khai)* | **10. Deploy Cloud (Production)**<br/>**11. Kịch bản kiểm thử E2E** | - Deploy Backend lên **Render.com** (dùng `render.yaml`).<br/>- Deploy Frontend lên **Vercel** trỏ về domain backend trên Render.<br/>- Bộ kiểm thử tự động 94/94 Backend test + 12/12 Frontend test Passed. | 🚀 Sẵn sàng Deploy |

---

## 🛠️ QUY TRÌNH PHỐI HỢP TRÊN GIT (TRÁNH XUNG ĐỘT)

1. Mọi thành viên trước khi code tính năng mới:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/<ten-thanh-vien>-<ten-nhiem-vu>
   ```
2. Sau khi hoàn thành và tự test chạy tốt trên máy:
   ```bash
   git add .
   git commit -m "feat(<module>): mo ta ngan gon noi dung da lam"
   git push origin feature/<ten-thanh-vien>-<ten-nhiem-vu>
   ```
3. Tạo **Pull Request (PR)** trên GitHub để merge nhánh feature vào nhánh `develop`.
