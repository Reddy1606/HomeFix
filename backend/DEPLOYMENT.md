# 🚀 Hướng dẫn Deploy Backend HomeFix lên Render

> Mục tiêu: có một URL online (VD `https://homefix-api.onrender.com`) để Frontend 1, 2, 3 kết nối và để demo/báo cáo.

Database vẫn nằm trên **Supabase** như cũ. Render chỉ chạy server Express, nên **không cần tạo database trên Render**.

---

## Bước 0: Chuẩn bị (làm một lần, trên máy của bạn)

1. Đã chạy `src/database/migration.sql` trong Supabase SQL Editor (Backend 1 đã làm).
2. Nạp dữ liệu demo vào Supabase (chạy từ máy bạn, có file `.env` trỏ tới Supabase):
   ```bash
   cd backend
   npm run seed
   ```
   Script an toàn khi chạy lại (không nhân đôi dữ liệu). Sau khi chạy sẽ in ra danh sách tài khoản demo.
3. Chạy `npm test` và đảm bảo tất cả PASS.
4. Merge code vào nhánh `main` qua Pull Request (theo `TEAM_RULES.md`). Render sẽ deploy từ `main`.

---

## Bước 1: Tạo Web Service trên Render

### Cách A: Blueprint (nhanh, dùng file `render.yaml` ở thư mục gốc)
1. Đăng nhập [render.com](https://render.com) bằng GitHub.
2. **New > Blueprint** → chọn repo `HomeFix` → Render đọc `render.yaml`.
3. Điền 3 biến được hỏi (xem bảng bên dưới) → **Apply**.

### Cách B: Tạo thủ công
1. **New > Web Service** → chọn repo GitHub, nhánh `main`.
2. Điền:

   | Mục | Giá trị |
   |---|---|
   | Root Directory | `backend` |
   | Runtime | Node |
   | Build Command | `npm ci` |
   | Start Command | `npm start` |
   | Instance Type | Free |
   | Health Check Path | `/api/health` |

3. Thêm Environment Variables (bảng bên dưới) → **Create Web Service**.

---

## Bước 2: Biến môi trường (Environment Variables)

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `NODE_ENV` | `production` | Tắt việc trả stack trace trong lỗi |
| `SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase > Project Settings > API |
| `SUPABASE_ANON_KEY` | anon key | Cùng trang trên |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **Bí mật tuyệt đối**, chỉ nhập trên Render, không commit |
| `JWT_SECRET` | chuỗi ngẫu nhiên dài | Blueprint tự sinh. Nếu tạo thủ công, tự đặt một chuỗi dài ≥ 32 ký tự |
| `JWT_EXPIRES_IN` | `7d` | Thời hạn token |
| `CORS_ORIGIN` | *(bỏ trống)* | Xem mục CORS bên dưới |

> Không cần đặt `PORT`: Render tự cấp và server đã đọc từ `process.env.PORT`.

---

## Bước 3: Kiểm tra sau khi deploy

1. Mở `https://<tên-service>.onrender.com/api/health` → phải thấy `"success": true`.
2. Mở `https://<tên-service>.onrender.com/api/services` → thấy danh sách dịch vụ.
3. Trong Postman, đổi biến collection `baseUrl` thành URL Render rồi chạy lại toàn bộ `HomeFix_Backend2_Postman_Collection.json`.
4. Gửi URL cho Frontend, đặt trong file `.env` của họ:
   ```
   VITE_API_URL=https://<tên-service>.onrender.com/api
   ```

---

## ⚠️ Những điều cần biết khi dùng gói Free của Render

- **Tự ngủ sau 15 phút không có request**, lần gọi đầu tiên sau đó mất khoảng 1 phút để khởi động lại. Trước buổi demo/báo cáo, hãy mở `/api/health` khoảng 1-2 phút trước để "đánh thức" server. Chính sách gói free có thể thay đổi, nên kiểm tra lại trên [render.com/docs/free](https://render.com/docs/free).
- Frontend nên hiển thị loading đủ lâu (hoặc thử gọi lại) cho lần gọi đầu.
- **Token đăng nhập không dùng chéo môi trường**: `JWT_SECRET` trên Render khác với máy local nên token lấy từ local sẽ báo "Token không hợp lệ" trên Render. Đăng nhập lại để lấy token mới.

### CORS
`app.js` đang đọc `CORS_ORIGIN` và chỉ nhận **một** domain. Khi chưa đặt biến này, server cho phép mọi domain, thuận tiện để các bạn Frontend vừa test từ `localhost` vừa test từ Vercel. Nếu muốn khóa lại, điền đúng 1 domain, VD `https://homefix.vercel.app` (khi đó `localhost` sẽ bị chặn).

---

## Xử lý sự cố thường gặp

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Deploy fail ngay bước build | Sai Root Directory | Đặt Root Directory = `backend` |
| `/api/health` OK nhưng API khác trả 500 | Sai `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`, hoặc chưa chạy migration | Xem tab **Logs** trên Render, kiểm tra lại 2 biến này |
| Log: "Database connection thất bại" | Như trên | Sửa biến môi trường rồi **Manual Deploy** |
| Frontend báo lỗi CORS | Đã đặt `CORS_ORIGIN` sai domain | Xóa biến này hoặc điền đúng domain Frontend (có `https://`, không có dấu `/` cuối) |
| Đăng nhập OK nhưng gọi API bị 401 "Token không hợp lệ" | Dùng token của môi trường khác | Đăng nhập lại trên môi trường đang gọi |
| Gọi API rất chậm lần đầu | Service free đang ngủ | Xem mục ⚠️ phía trên |

> Có thể dùng **Railway** thay thế (Root Directory = `backend`, Start = `npm start`, cùng bộ biến môi trường). Hãy kiểm tra gói miễn phí hiện tại của Railway trước khi chọn.
