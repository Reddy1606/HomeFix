# 🎨 HomeFix Frontend 1 - Giao diện Trang chủ & Dịch vụ

Giao diện Frontend 1 của dự án **HomeFix** (đề án EXE101), xây dựng bằng
**React + Vite + TailwindCSS + React Router**.

Phạm vi phụ trách (theo [TEAM_RULES.md](../TEAM_RULES.md)):

1. Layout chung: `Header`, `Navbar` (tích hợp trong Header, có menu mobile), `Footer`.
2. Trang chủ HomeFix (Hero, dịch vụ nổi bật, quy trình, vì sao chọn HomeFix, đánh giá khách hàng, CTA).
3. Trang danh sách dịch vụ sửa chữa (lọc theo danh mục, tìm kiếm, loading skeleton).
4. Trang chi tiết dịch vụ (giá, bảo hành, quy trình thực hiện, dịch vụ liên quan).

## 🚀 Chạy dự án

```bash
cd FE
npm install
cp .env.example .env     # chỉnh VITE_API_URL nếu backend chạy ở địa chỉ khác
npm run dev               # http://localhost:5173
```

Các lệnh khác:

```bash
npm run build     # build production vào thư mục dist/
npm run preview   # preview bản build
npm run lint      # kiểm tra code bằng oxlint
```

## 📁 Cấu trúc thư mục chính

```
src/
├── api/
│   ├── client.js       # axios instance, đọc VITE_API_URL, gắn token Authorization
│   └── services.js     # fetchServices / fetchServiceById (tự fallback mock nếu API lỗi)
├── data/
│   └── mockServices.js # dữ liệu dịch vụ mẫu, khớp schema bảng `services` của backend
├── components/
│   ├── layout/          # Header, Footer, Layout (dùng chung cho mọi trang)
│   └── common/          # ServiceCard, Skeleton, SectionHeading, Breadcrumb
└── pages/
    ├── Home.jsx           # Trang chủ
    ├── Services.jsx       # Danh sách dịch vụ
    ├── ServiceDetail.jsx  # Chi tiết dịch vụ
    ├── PlaceholderPage.jsx# Trang chờ cho route /booking, /login (thuộc FE2/FE3)
    └── NotFound.jsx
```

## 🔌 Kết nối Backend

- API dịch vụ dự kiến: `GET /services`, `GET /services/:id` (do **Backend 2** triển khai).
- Trong lúc API chưa sẵn sàng, `src/api/services.js` tự động dùng dữ liệu mẫu trong
  `src/data/mockServices.js` để không chặn tiến độ giao diện. Khi Backend 2 hoàn
  thành API thật, giao diện sẽ tự lấy dữ liệu thật mà không cần sửa code.
- Không hardcode URL API: luôn đọc qua biến môi trường `VITE_API_URL` (xem `.env.example`).

## 📱 Responsive

Toàn bộ giao diện được thiết kế **mobile-first** bằng TailwindCSS (breakpoint
`sm`, `lg`), ưu tiên trải nghiệm trên điện thoại vì khách đặt thợ chủ yếu qua
smartphone.
