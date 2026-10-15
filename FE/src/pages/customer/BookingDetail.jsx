
import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function BookingDetail() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("homefix_bookings") || "[]"
      );

      const found = saved.find(
        (item) => String(item.id) === String(id)
      );

      setBooking(found || null);
    } catch {
      setBooking(null);
    }
  }, [id]);

  if (!booking) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h2 className="text-2xl font-bold">
          Không tìm thấy thông tin đơn hàng
        </h2>
        <p className="mt-3 text-gray-600">
          Đơn mẫu hoặc đơn từ Backend chưa được tải
          vào trang chi tiết.
        </p>
        <Link to="/my-bookings" className="text-blue-600">
          ← Quay lại lịch sử
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold">
        Chi tiết đơn sửa chữa
      </h1>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            Đơn #{booking.id}
          </h2>

          <span className="rounded-full bg-blue-100 px-4 py-2 text-blue-700">
            {booking.status || "Đang chờ"}
          </span>
        </div>

        <div className="space-y-4">
          <p><b>Khách hàng:</b> {booking.name || "—"}</p>
          <p><b>Số điện thoại:</b> {booking.phone || "—"}</p>
          <p><b>Dịch vụ:</b> {booking.service || "—"}</p>
          <p><b>Địa chỉ:</b> {booking.address || "—"}</p>
          <p><b>Ngày hẹn:</b> {booking.date || "—"}</p>
          <p><b>Khung giờ:</b> {booking.time || "—"}</p>
          <p><b>Mô tả sự cố:</b> {booking.description || "—"}</p>
        </div>
      </div>

      <Link
        to="/my-bookings"
        className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white"
      >
        ← Quay lại lịch sử đặt lịch
      </Link>
    </main>
  );
}
