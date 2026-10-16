# FE3 giai đoạn 2 — Điều phối thợ & Dashboard

Nền: `Reddy1606/HomeFix`, nhánh `develop`, commit `e193f9bde44d112125eb1f45b72a560b38f6856c`.

## Chức năng

- `/admin/bookings`: mở **Chi tiết →**, tải chi tiết đơn mới nhất và các trạng thái được API cho phép. Chọn **Đã xác nhận** để mở danh sách thợ trong popup, tìm theo tên/SĐT/email, chọn thợ rồi bấm **Gán thợ & xác nhận**.
- Chỉ hiển thị tài khoản `technician`, `is_active === true`, `is_verified === true`; loại thợ đang có đơn `confirmed`, `in_progress`, `warranty_claim`. Đọc đủ các trang trước khi lọc, kể cả khi thợ phù hợp nằm ở trang sau.
- Kiểm tra lại danh sách ngay trước khi gửi cập nhật. Gửi `{ status: "confirmed", technician_id: "..." }` qua API hiện có. Không thông báo thành công trước khi máy chủ chấp nhận. Khi có lỗi giữ popup; lỗi 409 yêu cầu tải lại đơn.
- Các bước cập nhật trạng thái khác tiếp tục hoạt động, bao gồm các bước bảo hành do backend trả về. Không gửi kèm `technician_id` khi hủy đơn.
- `/admin`: biểu đồ cột ngang giá trị đơn hoàn thành và hoa hồng 15% ước tính, bộ chọn 6/12 tháng, bảng số liệu có thể mở; biểu đồ vòng tỷ lệ trạng thái với liên kết tới danh sách đơn đã lọc.
- Giữ giao diện hiện có, hỗ trợ màn hình hẹp, nhãn truy cập, điều khiển bàn phím và trạng thái tải/lỗi/rỗng.

## Dữ liệu thật & giới hạn API

Không sửa backend, không thêm thư viện production và không dùng dữ liệu mẫu trong chức năng này.

API Dashboard hiện chỉ trả vài bộ đếm (một số được tính trên 100 đơn đầu). FE đọc tất cả trang `GET /admin/bookings?limit=100&page=...` để tính đúng tổng số đơn và số lượng từng trạng thái. Một trang lỗi, thiếu dữ liệu hoặc phân trang thay đổi thì không công bố tổng từng phần. Tải lại để thử lại.

**Cách hiểu số liệu tài chính:** chỉ cộng `total_price` của đơn hiện có `status === "completed"`. Hoa hồng là `round(tổng × 15%)`, chưa phải khoản đã thu. Biểu đồ phân nhóm theo **tháng tạo đơn**, múi giờ Việt Nam; không dùng `updated_at` làm thời điểm thanh toán. Đơn đang bảo hành không nằm trong nhóm completed và không được tính vào chỉ số này. Các điểm này được ghi ngay trên Dashboard.

API chưa có trạng thái online, lịch làm việc, thời lượng công việc hay cơ chế giữ chỗ thợ. Vì vậy danh sách là những thợ chưa được gán vào đơn đang xử lý tại lúc kiểm tra, **không phải cam kết thợ rảnh ở khung giờ hẹn**. Thợ có đơn hẹn tương lai đã confirmed cũng tạm bị loại. Việc kiểm tra lại ở FE giảm tình trạng dữ liệu cũ nhưng không thay thế kiểm soát đồng thời ở backend.

Backend 2 nên bổ sung sau:

1. Endpoint chọn thợ theo `booking_id`, chuyên môn/khu vực/lịch hẹn, kiểm tra xung đột và gán thợ trong cùng giao dịch. API hiện từ chối đổi trạng thái sang chính trạng thái cũ, nên bản này gán khi xác nhận đơn pending, không hỗ trợ đổi riêng thợ trên đơn đã confirmed.
2. API tổng hợp thống kê toàn bộ dữ liệu để tránh tải toàn bộ đơn khi quy mô tăng. Bổ sung thời điểm hoàn thành/thu tiền và dữ liệu hoa hồng thực tế nếu cần báo cáo doanh thu kế toán theo ngày thu.

## Ghép vào repo

Tạo nhánh mới từ `develop` trước khi chép code:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/fe3-dispatch-revenue-charts
```

Thư mục `FE` trong gói đã bao gồm code develop và phần mới. Giữ lại `FE/.env` của bạn. Nếu develop có thay đổi sau commit nền trên, dùng patch hoặc đối chiếu các file thay đổi, tránh chép đè code mới của nhóm.

```bash
cd FE
npm ci
npm test
npm run lint
npm run build
npm run dev
```

Cấu hình `FE/.env`: `VITE_API_URL=http://localhost:5000/api`. Backend cần chạy riêng và đã cấu hình database. Không commit `.env` hoặc `node_modules`.

Theo quy tắc repo, trước khi commit/push cần chạy thêm `npm test` trong `backend` với máy chủ và môi trường test phù hợp. Bản này chưa commit, push hoặc tạo PR.

## Kiểm tra thủ công với backend thật

Kết quả trong môi trường bàn giao: 12 bài kiểm thử Node đã qua (7 bài về tổng hợp/phân trang/lọc thợ, 1 bài tích hợp Axios và render biểu đồ, 4 bài validation có sẵn); production build qua. Lint chạy thành công, còn các cảnh báo đã có trên develop; không có cảnh báo mới trong các module FE3 được thêm. Kiểm thử tích hợp dùng dữ liệu mô phỏng theo hợp đồng API, không phải database thật. Chromium và trình duyệt tích hợp không khởi động được trong môi trường này, nên chưa xác nhận tương tác và giao diện desktop/mobile trên trình duyệt. Cần chạy các bước dưới đây khi ghép code.

1. Đăng nhập Admin; mở đơn pending, chọn xác nhận. Thợ chưa KYC/bị khóa/đang có đơn không xuất hiện; tìm kiếm và làm mới hoạt động.
2. Chọn thợ, lưu; kiểm tra request có `technician_id`, danh sách đổi trạng thái và chi tiết hiển thị thợ.
3. Tạo lỗi API hoặc xung đột trạng thái từ phiên khác; popup báo lỗi, không báo lưu thành công, có thể tải lại.
4. Mở Dashboard với dữ liệu nhiều hơn 100 đơn, đối chiếu tổng và doanh số completed, đổi 6/12 tháng, mở bảng số liệu.
5. Thử dữ liệu rỗng, mất mạng và màn hình điện thoại. Customer không truy cập được `/admin`.
