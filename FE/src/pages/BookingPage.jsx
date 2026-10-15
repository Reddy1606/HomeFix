
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./BookingPage.css";

const initialForm = {
  name: "",
  phone: "",
  address: "",
  service: "",
  date: "",
  time: "",
  description: ""
};

const services = [
  "Sửa chữa điện",
  "Sửa chữa nước",
  "Sửa điều hòa",
  "Sửa máy giặt",
  "Sửa tủ lạnh",
  "Dịch vụ khác"
];

const timeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "13:00 - 15:00",
  "15:00 - 17:00"
];

function localDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 10);
}

export default function BookingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const update = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submit = (e) => {
    e.preventDefault();
    setError("");

    if (!/^0\d{9}$/.test(form.phone)) {
      setError("Số điện thoại phải gồm 10 chữ số, bắt đầu bằng 0.");
      return;
    }

    if (form.date < localDate()) {
      setError("Ngày hẹn không được ở trong quá khứ.");
      return;
    }

    try {
      const bookings = JSON.parse(
        localStorage.getItem("homefix_bookings") || "[]"
      );

      const newBooking = {
        ...form,
        id: Date.now().toString(),
        status: "Đang chờ",
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(
        "homefix_bookings",
        JSON.stringify([...bookings, newBooking])
      );

      alert("Đặt lịch thành công (chế độ demo)!");
      navigate("/my-bookings");
    } catch {
      setError("Không thể lưu lịch hẹn. Vui lòng thử lại.");
    }
  };

  return (
    <main className="booking-page">
      <div className="booking-heading">
        <h1>Đặt lịch sửa chữa HomeFix</h1>
        <p>Đặt lịch nhanh chóng, tiện lợi và dễ dàng.</p>
      </div>

      <div className="booking-grid">
        <form className="booking-card" onSubmit={submit}>
          <h2>Thông tin đặt lịch</h2>

          <label>Họ và tên *</label>
          <input
            name="name"
            value={form.name}
            onChange={update}
            placeholder="Nhập họ và tên"
            required
          />

          <label>Số điện thoại *</label>
          <input
            name="phone"
            value={form.phone}
            onChange={update}
            placeholder="09xxxxxxxx"
            inputMode="numeric"
            maxLength={10}
            required
          />

          <label>Địa chỉ sửa chữa *</label>
          <input
            name="address"
            value={form.address}
            onChange={update}
            placeholder="Số nhà, đường, phường..."
            required
          />

          <label>Dịch vụ sửa chữa *</label>
          <select
            name="service"
            value={form.service}
            onChange={update}
            required
          >
            <option value="">Chọn dịch vụ</option>
            {services.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>

          <div className="booking-row">
            <div>
              <label>Ngày hẹn *</label>
              <input
                type="date"
                name="date"
                min={localDate()}
                value={form.date}
                onChange={update}
                required
              />
            </div>

            <div>
              <label>Khung giờ *</label>
              <select
                name="time"
                value={form.time}
                onChange={update}
                required
              >
                <option value="">Chọn giờ</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label>Mô tả sự cố *</label>
          <textarea
            name="description"
            value={form.description}
            onChange={update}
            rows={4}
            placeholder="Mô tả thiết bị và tình trạng hư hỏng..."
            required
          />

          {error && <p className="booking-error">{error}</p>}

          <button type="submit" className="booking-submit">
            Xác nhận đặt lịch
          </button>
        </form>

        <aside className="booking-summary">
          <h2>Tóm tắt lịch hẹn</h2>
          <div className="summary-line">
            <span>Khách hàng</span>
            <strong>{form.name || "Chưa nhập"}</strong>
          </div>
          <div className="summary-line">
            <span>Điện thoại</span>
            <strong>{form.phone || "Chưa nhập"}</strong>
          </div>
          <div className="summary-line">
            <span>Dịch vụ</span>
            <strong>{form.service || "Chưa chọn"}</strong>
          </div>
          <div className="summary-line">
            <span>Ngày hẹn</span>
            <strong>{form.date || "Chưa chọn"}</strong>
          </div>
          <div className="summary-line">
            <span>Khung giờ</span>
            <strong>{form.time || "Chưa chọn"}</strong>
          </div>
          <div className="summary-line">
            <span>Địa chỉ</span>
            <strong>{form.address || "Chưa nhập"}</strong>
          </div>

          <div className="booking-price">
            <span>Chi phí dự kiến</span>
            <strong>Báo giá sau khi kiểm tra</strong>
          </div>

          <p className="booking-note">
            HomeFix sẽ xác nhận lịch hẹn sau khi tiếp nhận yêu cầu.
          </p>
        </aside>
      </div>
    </main>
  );
}
