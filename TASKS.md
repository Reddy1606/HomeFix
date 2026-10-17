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
| **Backend 1**<br/>*(Auth & Database)* | **1. Upload ảnh & Media Storage** | - Tích hợp Supabase Storage và Local Storage fallback.<br/>- API upload ảnh đại diện (avatar) người dùng.<br/>- API upload ảnh CCCD / chứng chỉ nghề thợ phục vụ duyệt KYC.<br/>*(✅ Đã hoàn thành trên `feature/be1-upload-media-storage`)* | ✅ Xong |
| **Backend 2**<br/>*(Services & Bookings)* | **2. API Đánh giá & Phản hồi (Reviews)**<br/>**3. API Doanh thu & Hoa hồng** | - Tạo bảng `reviews` (booking_id, rating 1-5 sao, comment, created_at).<br/>- API `POST /api/bookings/:id/review` (chỉ khách hàng được đánh giá khi đơn `completed`).<br/>- Bổ sung tính toán doanh thu hoa hồng 15% vào API Dashboard. | 🔴 Cao |
| **Frontend 1**<br/>*(Trang chủ & Dịch vụ)* | **4. Nâng cấp Bộ lọc & Tìm kiếm**<br/>**5. Luồng liên kết đặt lịch nhanh** | - Thêm ô tìm kiếm tức thì theo từ khóa tại trang `/services`.<br/>- Bộ lọc khoảng giá (min - max) và danh mục linh hoạt.<br/>- Nút "Đặt lịch ngay" trên Service Card & Detail truyền thẳng `?serviceId=...` sang form đặt lịch. | 🟡 Trung bình |
| **Frontend 2**<br/>*(Đặt lịch & Khách hàng)* | **6. Đánh giá & Phản hồi thợ**<br/>**7. Toast Notification & UX** | - Thiết kế Modal chấm điểm sao và nhận xét thợ tại trang chi tiết đơn khi trạng thái là `completed`.<br/>- Thêm Toast thông báo nổi (thành công / lỗi) khi đặt lịch, hủy đơn.<br/>- Cải thiện hiển thị bản đồ / địa chỉ sửa chữa. | 🔴 Cao |
| **Frontend 3**<br/>*(Admin & Dashboard)* | **8. Modal điều phối chọn thợ**<br/>**9. Biểu đồ thống kê doanh thu** | - Tại `/admin/bookings`, tạo Popup hiển thị danh sách thợ khả dụng (đã KYC) để Admin click chọn gán vào đơn.<br/>- Bổ sung biểu đồ trực quan (Charts) doanh thu và tỷ lệ trạng thái đơn trên Admin Dashboard. | 🔴 Cao |
| **DevOps / QA Tester**<br/>*(Kiểm thử & Triển khai)* | **10. Deploy Cloud (Production)**<br/>**11. Kịch bản kiểm thử E2E** | - Deploy Backend lên **Render.com** (dùng `render.yaml`).<br/>- Deploy Frontend lên **Vercel** trỏ về domain backend trên Render.<br/>- Chạy kịch bản kiểm thử toàn bộ luồng demo không phát sinh lỗi. | 🔴 Cao |

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
