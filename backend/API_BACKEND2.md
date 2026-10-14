# 📘 HomeFix API - Dịch vụ, Đặt lịch & Admin (Backend 2)

Tài liệu cho Frontend 1, 2, 3. Dùng chung quy ước trong `TEAM_RULES.md`:
JSON `snake_case`, header `Authorization: Bearer <token>`, response `{ success, message, data? | errors? }`.

**Base URL:** `http://localhost:5000/api` (local) hoặc `https://<tên-service>.onrender.com/api` (online)

Test nhanh: import `HomeFix_Backend2_Postman_Collection.json` vào Postman.

---

## Tổng quan endpoint

| Method | Endpoint | Quyền | Dành cho |
|---|---|---|---|
| GET | `/services` | Public | FE1 |
| GET | `/services/categories` | Public | FE1 |
| GET | `/services/:id` | Public | FE1 |
| POST | `/bookings` | Customer | FE2 |
| GET | `/bookings/my` | Customer | FE2 |
| GET | `/bookings/:id` | Customer (đơn của mình) / Admin | FE2, FE3 |
| PUT | `/bookings/:id/cancel` | Customer | FE2 |
| GET | `/admin/services` | Admin | FE3 |
| POST | `/admin/services` | Admin | FE3 |
| GET | `/admin/services/:id` | Admin | FE3 |
| PUT | `/admin/services/:id` | Admin | FE3 |
| DELETE | `/admin/services/:id` | Admin | FE3 |
| GET | `/admin/bookings` | Admin | FE3 |
| GET | `/admin/bookings/:id` | Admin | FE3 |
| PUT | `/admin/bookings/:id/status` | Admin | FE3 |

Phân quyền: thiếu token → `401`; sai role → `403`. Tài khoản **admin không đặt lịch được** (`POST /bookings` chỉ dành cho customer).

---

## 1. Dịch vụ (Public) - FE1

### `GET /services`
Chỉ trả dịch vụ đang hoạt động (`is_active = true`).

| Query | Kiểu | Mô tả |
|---|---|---|
| `category` | string | Lọc đúng tên danh mục, VD `Điện lạnh` |
| `search` | string | Tìm trong tên + mô tả (phải gõ đúng dấu tiếng Việt) |
| `min_price`, `max_price` | số nguyên | Khoảng giá (VNĐ) |
| `sort` | `category` (mặc định), `price_asc`, `price_desc`, `name`, `newest` | Sắp xếp |
| `page`, `limit` | số nguyên | Mặc định `page=1`, `limit=50` (tối đa 100) |

```json
{
  "success": true,
  "message": "Lấy danh sách dịch vụ thành công.",
  "data": {
    "services": [
      {
        "id": "uuid",
        "name": "Bảo dưỡng máy lạnh",
        "category": "Điện lạnh",
        "description": "Vệ sinh, kiểm tra gas, bảo dưỡng máy lạnh định kỳ",
        "base_price": 200000,
        "price_unit": "per_job",
        "warranty_days": 30,
        "is_active": true,
        "created_at": "...",
        "updated_at": "..."
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 18, "total_pages": 1 }
  }
}
```

### `GET /services/categories`
Dùng làm tab / bộ lọc.
```json
{ "data": { "categories": [ { "category": "Điện lạnh", "total": 4 }, { "category": "Điện nước", "total": 6 } ] } }
```

### `GET /services/:id`
Trả `data.service` (cùng cấu trúc như trên). `404` nếu không tồn tại **hoặc đã bị ẩn**.

---

## 2. Đặt lịch (Customer) - FE2

### `POST /bookings`
```json
{
  "service_id": "uuid",
  "booking_type": "immediate",
  "address": "123 Nguyễn Huệ, Quận 1, TP.HCM",
  "description": "Máy lạnh chảy nước, không mát"
}
```

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| `service_id` | ✅ | UUID của dịch vụ đang hoạt động |
| `booking_type` | | `immediate` (mặc định) hoặc `scheduled` |
| `scheduled_at` | ✅ nếu `scheduled` | ISO 8601 **kèm múi giờ**, đặt trước ít nhất 30 phút |
| `address` | ✅ | 5-500 ký tự |
| `description` | | Tối đa 1000 ký tự |

> ⚠️ **`scheduled_at` phải có múi giờ.** Giá trị từ `<input type="datetime-local">` (VD `2026-10-20T09:00`) sẽ bị từ chối. Hãy đổi sang `new Date(value).toISOString()` trước khi gửi.
>
> `total_price`, `status`, `customer_id` **do server quyết định**, FE có gửi cũng bị bỏ qua. Giá được chốt bằng `base_price` của dịch vụ tại thời điểm đặt.

Thành công `201`:
```json
{
  "success": true,
  "message": "Đặt lịch thành công! HomeFix sẽ sớm điều phối thợ cho bạn.",
  "data": {
    "booking": {
      "id": "uuid",
      "customer_id": "uuid",
      "technician_id": null,
      "service_id": "uuid",
      "status": "pending",
      "booking_type": "immediate",
      "scheduled_at": null,
      "address": "123 Nguyễn Huệ, Quận 1, TP.HCM",
      "description": "Máy lạnh chảy nước, không mát",
      "total_price": 350000,
      "commission_rate": 0.15,
      "warranty_until": null,
      "created_at": "...",
      "updated_at": "...",
      "services": { "name": "Sửa máy lạnh không lạnh", "category": "Điện lạnh", "description": "...", "base_price": 350000, "price_unit": "per_job", "warranty_days": 30 },
      "can_cancel": true
    }
  }
}
```

### `GET /bookings/my` - Lịch sử đặt lịch
Query: `status` (một trong các trạng thái bên dưới), `page`, `limit` (mặc định 20). Đơn mới nhất lên trước.
Trả `data.bookings[]` (mỗi phần tử có `services` và `can_cancel`) + `data.pagination`.

### `GET /bookings/:id` - Chi tiết & theo dõi trạng thái
Trả `data.booking`, kèm:
- `technician: { id, full_name, phone, rating_avg }` khi đã được gán thợ (ngược lại `null`)
- `customer: { id, full_name, email, phone }`
- `warranty_until` (ngày hết hạn bảo hành, có sau khi `completed`)
- `can_cancel`: `true` → hiển thị nút "Hủy đơn"

Đơn của người khác → `404`.

### `PUT /bookings/:id/cancel` - Khách tự hủy
Chỉ hủy được khi `pending` hoặc `confirmed`. Trạng thái khác → `400` kèm thông báo tiếng Việt. Không cần body.

---

## 3. Trạng thái đơn

| `status` | Ý nghĩa hiển thị | Admin chuyển tiếp được sang |
|---|---|---|
| `pending` 🟡 | Chờ điều phối thợ | `confirmed`, `cancelled` |
| `confirmed` 🔵 | Thợ đang đến | `in_progress`, `cancelled` |
| `in_progress` 🟠 | Đang sửa chữa | `completed`, `cancelled` |
| `completed` 🟢 | Hoàn thành (bắt đầu tính bảo hành) | `warranty_claim` |
| `warranty_claim` 🟣 | Yêu cầu bảo hành | `in_progress`, `completed` |
| `cancelled` 🔴 | Đã hủy | *(kết thúc)* |

- Chuyển sai luồng (VD `pending → completed`) → `400`.
- Khi `completed` lần đầu, server tự đặt `warranty_until = hôm nay + warranty_days` của dịch vụ (theo giờ Việt Nam).
- Chỉ chuyển sang `warranty_claim` khi **còn hạn bảo hành**.
- API chi tiết đơn của Admin trả sẵn `allowed_next_statuses` để FE3 hiển thị đúng các nút bấm.

---

## 4. Admin - Quản lý dịch vụ - FE3

Tất cả cần token admin.

### `GET /admin/services`
Giống `GET /services` nhưng **gồm cả dịch vụ đã ẩn**, thêm query `is_active=true|false`. Mặc định `limit=20`, sắp xếp mới nhất trước.

### `POST /admin/services`
```json
{
  "name": "Vệ sinh quạt trần",
  "category": "Thiết bị gia dụng",
  "description": "Lau chùi, tra dầu, kiểm tra tụ điện",
  "base_price": 90000,
  "price_unit": "per_job",
  "warranty_days": 7
}
```
Bắt buộc: `name` (2-200 ký tự), `category`, `base_price` (số nguyên VNĐ ≥ 0). `warranty_days` 0-365 (mặc định 7). Trả `201` + `data.service`.

### `PUT /admin/services/:id`
Gửi trường nào cập nhật trường đó (kể cả `is_active` để ẩn/hiện lại). Body rỗng → `400`.
Đổi giá chỉ ảnh hưởng đơn **đặt mới**, các đơn cũ giữ giá đã chốt.

### `DELETE /admin/services/:id`
**Xóa mềm** (đặt `is_active = false`), không xóa dữ liệu. Dịch vụ biến mất khỏi API public và không đặt mới được, nhưng đơn cũ vẫn xem được bình thường.

---

## 5. Admin - Quản lý đơn - FE3

### `GET /admin/bookings`
| Query | Mô tả |
|---|---|
| `status` | Lọc theo trạng thái |
| `customer_id`, `technician_id` | Lọc theo khách / thợ (UUID) |
| `booking_type` | `immediate` hoặc `scheduled` |
| `from`, `to` | Lọc theo **ngày tạo đơn**. Dạng `YYYY-MM-DD` (hiểu theo giờ VN, `to` tính hết ngày) hoặc ISO có múi giờ |
| `page`, `limit` | Mặc định 20, tối đa 100 |

Mỗi đơn có `customer`, `technician` (có thể `null`) và `services`.

### `GET /admin/bookings/:id`
Trả `data.booking` + `data.allowed_next_statuses`.

### `PUT /admin/bookings/:id/status`
```json
{ "status": "confirmed", "technician_id": "uuid-cua-tho" }
```
- `status` bắt buộc, phải là bước chuyển hợp lệ (bảng mục 3).
- `technician_id` tùy chọn: phải là tài khoản `technician` đang hoạt động và **đã xác minh KYC**. Lấy danh sách thợ bằng `GET /admin/users?role=technician` (API của Backend 1, dùng `is_verified` để lọc).
- Nếu hai admin cùng đổi một đơn → người đến sau nhận `409` ("Vui lòng tải lại").

---

## 6. Mã lỗi thường gặp

| HTTP | Khi nào | Ví dụ `message` |
|---|---|---|
| 400 | Dữ liệu sai / bước chuyển trạng thái không hợp lệ | `Dữ liệu không hợp lệ.` (kèm `errors: [{ field, message }]`) |
| 401 | Thiếu / sai / hết hạn token | `Không tìm thấy token xác thực. Vui lòng đăng nhập.` |
| 403 | Sai quyền | `Bạn không có quyền truy cập. Yêu cầu role: admin.` |
| 404 | Không tìm thấy (kể cả đơn của người khác) | `Không tìm thấy đơn đặt lịch.` |
| 409 | Đơn vừa bị người khác đổi trạng thái | `Trạng thái đơn vừa được cập nhật...` |
| 500 | Lỗi server | `Đã xảy ra lỗi từ server.` |

## 7. Lưu ý cho Frontend

- **Phân trang** trả `pagination: { page, limit, total, total_pages }` (snake_case theo API Contract). Riêng `GET /admin/users` của Backend 1 đang trả `totalPages` (camelCase).
- `base_price`, `total_price` là số nguyên VNĐ → định dạng bằng `toLocaleString('vi-VN')`.
- Các mốc thời gian (`created_at`, `scheduled_at`) là ISO 8601 UTC → hiển thị bằng giờ địa phương của trình duyệt.
- Khóa nút "Xác nhận đặt lịch" khi đang gửi (chống tạo đơn trùng), server hiện chưa chặn đơn trùng.
