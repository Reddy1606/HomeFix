import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { fetchServices, formatPrice } from '../api/services';
import { createBooking } from '../api/bookings';
import { fetchMySubscription } from '../api/packages';
import './BookingPage.css';

const TIME_SLOTS = [
  { label: '08:00 - 10:00 (Sáng)', time: '08:30:00' },
  { label: '10:00 - 12:00 (Trưa)', time: '10:30:00' },
  { label: '13:00 - 15:00 (Chiều)', time: '13:30:00' },
  { label: '15:00 - 17:00 (Chiều muộn)', time: '15:30:00' },
  { label: '18:00 - 20:00 (Tối)', time: '18:30:00' },
];

function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get('serviceId') || '';

  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activeSub, setActiveSub] = useState(null);
  const [useMaintenanceQuota, setUseMaintenanceQuota] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState(preselectedServiceId);
  const [bookingType, setBookingType] = useState('immediate'); // 'immediate' | 'scheduled'
  const [scheduledDate, setScheduledDate] = useState(getTomorrowDateString());
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const [address, setAddress] = useState(user?.address || '');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Tải danh sách dịch vụ thực tế từ backend
  useEffect(() => {
    let mounted = true;
    fetchServices()
      .then((data) => {
        if (!mounted) return;
        const list = Array.isArray(data) ? data : [];
        setServices(list);
        if (preselectedServiceId && list.some((s) => s.id === preselectedServiceId)) {
          setSelectedServiceId(preselectedServiceId);
        } else if (list.length > 0 && !selectedServiceId) {
          setSelectedServiceId(list[0].id);
        }
      })
      .catch((err) => {
        console.error('Lỗi tải dịch vụ:', err);
      })
      .finally(() => {
        if (mounted) setLoadingServices(false);
      });
    return () => {
      mounted = false;
    };
  }, [preselectedServiceId]);

  // Cập nhật địa chỉ mặc định khi thông tin user thay đổi
  useEffect(() => {
    if (user?.address && !address) {
      setAddress(user.address);
    }
    if (user && user.role === 'customer') {
      fetchMySubscription()
        .then((data) => {
          if (data?.has_subscription) {
            setActiveSub(data.subscription);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const currentService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  const pricingInfo = useMemo(() => {
    if (!currentService) return { original: 0, final: 0, isFree: false, discount: 0 };
    const base = Number(currentService.base_price) || 0;
    if (useMaintenanceQuota && activeSub && activeSub.remaining_quota > 0) {
      return { original: base, final: 0, isFree: true, discount: 100 };
    }
    if (activeSub && activeSub.discount_percentage > 0) {
      const discounted = Math.round(base * (1 - activeSub.discount_percentage / 100));
      return { original: base, final: discounted, isFree: false, discount: activeSub.discount_percentage };
    }
    return { original: base, final: base, isFree: false, discount: 0 };
  }, [currentService, useMaintenanceQuota, activeSub]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!user) {
      setError('Vui lòng đăng nhập bằng tài khoản Khách hàng để tạo đơn đặt lịch.');
      return;
    }

    if (user.role === 'technician') {
      setError('Tài khoản thợ không thể đặt lịch sửa chữa. Vui lòng dùng tài khoản Khách hàng.');
      return;
    }

    if (!selectedServiceId) {
      setError('Vui lòng chọn dịch vụ sửa chữa.');
      return;
    }

    if (!address.trim() || address.trim().length < 5) {
      setError('Vui lòng nhập địa chỉ cụ thể (ít nhất 5 ký tự).');
      return;
    }

    let scheduledAt = null;
    if (bookingType === 'scheduled') {
      if (!scheduledDate) {
        setError('Vui lòng chọn ngày hẹn.');
        return;
      }
      const slotTime = TIME_SLOTS[selectedSlotIndex]?.time || '09:00:00';
      // Múi giờ Việt Nam +07:00
      scheduledAt = `${scheduledDate}T${slotTime}+07:00`;

      // Kiểm tra thời gian có trong quá khứ không
      const targetTime = new Date(scheduledAt).getTime();
      if (targetTime < Date.now() + 30 * 60 * 1000) {
        setError('Thời gian hẹn phải sau thời điểm hiện tại ít nhất 30 phút.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        service_id: selectedServiceId,
        booking_type: bookingType,
        scheduled_at: scheduledAt,
        address: address.trim(),
        description: description.trim() || undefined,
        use_maintenance_quota: useMaintenanceQuota,
      };

      const result = await createBooking(payload);
      setSuccessMsg(activeSub ? '⚡ Đặt lịch thành công! Đơn của bạn được xếp Hàng Đợi Ưu Tiên VIP và thợ sẽ nhận việc sớm nhất.' : 'Đặt lịch sửa chữa thành công!');

      // Lưu dự phòng vào localStorage để tương thích các component cũ nếu có
      try {
        const localList = JSON.parse(localStorage.getItem('homefix_bookings') || '[]');
        localList.unshift({
          ...result,
          service: currentService?.name || 'Dịch vụ sửa chữa',
          date: scheduledDate,
          address: address.trim(),
        });
        localStorage.setItem('homefix_bookings', JSON.stringify(localList));
      } catch (e) {
        // bỏ qua
      }

      setTimeout(() => {
        navigate('/my-bookings');
      }, 1200);
    } catch (err) {
      const resMsg = err.response?.data?.message;
      const fieldErrors = err.response?.data?.errors;
      if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
        setError(`${resMsg || 'Lỗi dữ liệu'}: ${fieldErrors.map((f) => f.message).join('; ')}`);
      } else {
        setError(resMsg || 'Không thể tạo đơn đặt lịch. Vui lòng kiểm tra lại kết nối và thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="booking-page">
      <div className="booking-heading">
        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 mb-2">
          ⚡ Nhanh chóng • Minh bạch • Uy tín
        </span>
        <h1>Đặt lịch thợ sửa chữa HomeFix</h1>
        <p>Kết nối ngay với đội ngũ thợ lành nghề, đã qua xác minh hồ sơ và lý lịch.</p>
      </div>

      {!user && (
        <div className="mx-auto mb-6 max-w-4xl rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 flex flex-wrap items-center justify-between gap-4">
          <div>
            <strong>Lưu ý:</strong> Bạn cần đăng nhập tài khoản Khách hàng để tạo đơn và theo dõi tiến độ thợ đến sửa.
          </div>
          <Link
            to={`/login?redirect=${encodeURIComponent('/booking' + (selectedServiceId ? `?serviceId=${selectedServiceId}` : ''))}`}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Đăng nhập ngay →
          </Link>
        </div>
      )}

      {user && activeSub && (
        <div className="mx-auto mb-6 max-w-4xl rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-500/10 via-amber-400/20 to-yellow-500/10 p-4 text-amber-950 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white text-xl shadow-md">
              👑
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-900">Đặc Quyền Hội Viên: {activeSub.package_name}</span>
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black text-white">VIP</span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                ⚡ Đơn của bạn được <strong>Ưu tiên nhận sớm nhất</strong> • Bảo hành mở rộng <strong>{activeSub.warranty_days} ngày</strong> • Giảm <strong>{activeSub.discount_percentage}%</strong> tiền công.
              </p>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold text-amber-900">Lượt bảo dưỡng miễn phí:</span>{' '}
            <strong className="text-base text-amber-700">{activeSub.remaining_quota}</strong> lần
          </div>
        </div>
      )}

      {user && !activeSub && (
        <div className="mx-auto mb-6 max-w-4xl rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-blue-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>
              Muốn đơn <strong>luôn được thợ nhận sớm nhất</strong> và miễn phí bảo dưỡng định kỳ?
            </span>
          </div>
          <Link
            to="/packages"
            className="font-bold text-brand-600 hover:text-brand-800 underline flex items-center gap-1"
          >
            Xem gói HomeCare từ 41.5k/tháng →
          </Link>
        </div>
      )}

      <div className="booking-grid">
        <form className="booking-card" onSubmit={handleSubmit}>
          <h2>Thông tin đặt lịch</h2>

          {/* Dịch vụ */}
          <label htmlFor="service-select">Dịch vụ sửa chữa *</label>
          <select
            id="service-select"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            disabled={loadingServices}
            required
          >
            {loadingServices ? (
              <option value="">Đang tải danh sách dịch vụ...</option>
            ) : services.length === 0 ? (
              <option value="">Chưa có dịch vụ nào trong hệ thống</option>
            ) : (
              services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category}) — {formatPrice(s.base_price)}
                </option>
              ))
            )}
          </select>

          {/* Tùy chọn sử dụng lượt bảo dưỡng miễn phí theo gói VIP */}
          {activeSub && activeSub.remaining_quota > 0 && (
            <div style={{ margin: '14px 0', padding: '12px 14px', background: '#fef3c7', borderRadius: '10px', border: '1px solid #fde68a' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, fontWeight: 700, color: '#92400e' }}>
                <input
                  type="checkbox"
                  checked={useMaintenanceQuota}
                  onChange={(e) => setUseMaintenanceQuota(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>🎁 Sử dụng 1 lượt bảo dưỡng định kỳ miễn phí (Còn {activeSub.remaining_quota} lần)</span>
              </label>
              <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px', marginLeft: '26px' }}>
                Chi phí tiền công đơn này sẽ giảm về <strong>0 đ</strong> theo đặc quyền {activeSub.package_name}.
              </div>
            </div>
          )}

          {/* Loại đặt lịch: Tức thì hay Hẹn giờ */}
          <label>Hình thức gọi thợ *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setBookingType('immediate')}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: bookingType === 'immediate' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: bookingType === 'immediate' ? '#eff6ff' : '#fff',
                color: bookingType === 'immediate' ? '#1d4ed8' : '#334155',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div>⚡ Đến ngay</div>
              <small style={{ fontWeight: 400, color: '#64748b' }}>Thợ nhận đơn trong 15-30p</small>
            </button>

            <button
              type="button"
              onClick={() => setBookingType('scheduled')}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: bookingType === 'scheduled' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: bookingType === 'scheduled' ? '#eff6ff' : '#fff',
                color: bookingType === 'scheduled' ? '#1d4ed8' : '#334155',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div>📅 Đặt hẹn trước</div>
              <small style={{ fontWeight: 400, color: '#64748b' }}>Chọn ngày & khung giờ</small>
            </button>
          </div>

          {/* Nếu chọn Hẹn giờ */}
          {bookingType === 'scheduled' && (
            <div className="booking-row">
              <div>
                <label htmlFor="scheduled-date">Ngày hẹn *</label>
                <input
                  id="scheduled-date"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="time-slot">Khung giờ *</label>
                <select
                  id="time-slot"
                  value={selectedSlotIndex}
                  onChange={(e) => setSelectedSlotIndex(Number(e.target.value))}
                  required
                >
                  {TIME_SLOTS.map((slot, index) => (
                    <option key={slot.label} value={index}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Địa chỉ */}
          <label htmlFor="booking-address">Địa chỉ sửa chữa cụ thể *</label>
          <input
            id="booking-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
            required
            minLength={5}
            maxLength={500}
          />

          {/* Mô tả sự cố */}
          <label htmlFor="booking-desc">Mô tả sự cố & yêu cầu chi tiết</label>
          <textarea
            id="booking-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Mô tả hiện trạng hư hỏng, loại thiết bị hoặc yêu cầu đặc biệt cho thợ..."
            maxLength={1000}
          />

          {error && <p className="booking-error" style={{ color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '6px' }}>⚠️ {error}</p>}
          {successMsg && <p style={{ color: '#16a34a', background: '#f0fdf4', padding: '10px', borderRadius: '6px', fontWeight: 600 }}>✅ {successMsg}</p>}

          <button
            type="submit"
            className="booking-submit"
            disabled={submitting || loadingServices}
            style={{ opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Đang gửi yêu cầu đặt lịch...' : 'Xác nhận đặt lịch ngay'}
          </button>
        </form>

        {/* Tóm tắt */}
        <aside className="booking-summary">
          <h2>Tóm tắt lịch hẹn</h2>

          <div className="summary-line">
            <span>Khách hàng</span>
            <strong>{user?.full_name || user?.name || (user ? 'Đang cập nhật' : 'Chưa đăng nhập')}</strong>
          </div>

          <div className="summary-line">
            <span>Số điện thoại</span>
            <strong>{user?.phone || 'Chưa cập nhật'}</strong>
          </div>

          <div className="summary-line">
            <span>Dịch vụ</span>
            <strong>{currentService?.name || 'Chưa chọn'}</strong>
          </div>

          <div className="summary-line">
            <span>Hình thức</span>
            <strong>{bookingType === 'immediate' ? '⚡ Đến ngay (15-30p)' : '📅 Đặt lịch hẹn'}</strong>
          </div>

          {bookingType === 'scheduled' && (
            <div className="summary-line">
              <span>Thời gian hẹn</span>
              <strong>
                {scheduledDate} ({TIME_SLOTS[selectedSlotIndex]?.label.split(' ')[0]})
              </strong>
            </div>
          )}

          <div className="summary-line">
            <span>Địa chỉ</span>
            <strong style={{ maxWidth: '200px', textAlign: 'right', wordBreak: 'break-word' }}>
              {address || 'Chưa nhập'}
            </strong>
          </div>

          <div className="summary-line">
            <span>Hàng đợi nhận việc</span>
            <strong style={{ color: activeSub ? '#d97706' : '#2563eb' }}>
              {activeSub ? '⚡ Ưu tiên VIP (Hàng đợi số 1)' : 'Tiêu chuẩn'}
            </strong>
          </div>

          <div className="summary-line">
            <span>Bảo hành</span>
            <strong style={{ color: activeSub ? '#15803d' : '#334155' }}>
              {activeSub
                ? `${activeSub.warranty_days} ngày (Bảo hành VIP HomeFix)`
                : currentService
                ? `${currentService.warranty_days} ngày`
                : '—'}
            </strong>
          </div>

          <div className="booking-price">
            <span>Chi phí thanh toán</span>
            <div style={{ textAlign: 'right' }}>
              {pricingInfo.isFree ? (
                <div>
                  <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.85rem', marginRight: '6px' }}>
                    {formatPrice(pricingInfo.original)}
                  </span>
                  <strong style={{ color: '#16a34a', fontSize: '1.25rem' }}>0 đ</strong>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>🎁 Miễn phí (Trừ 1 lượt gói)</div>
                </div>
              ) : pricingInfo.discount > 0 ? (
                <div>
                  <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.85rem', marginRight: '6px' }}>
                    {formatPrice(pricingInfo.original)}
                  </span>
                  <strong style={{ color: '#2563eb', fontSize: '1.25rem' }}>
                    {formatPrice(pricingInfo.final)}
                  </strong>
                  <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700 }}>Giảm {pricingInfo.discount}% Hội viên VIP</div>
                </div>
              ) : (
                <strong style={{ color: '#2563eb', fontSize: '1.25rem' }}>
                  {currentService ? formatPrice(pricingInfo.final) : 'Báo giá sau'}
                </strong>
              )}
            </div>
          </div>

          <p className="booking-note">
            🛡️ Thợ sẽ kiểm tra thực tế và xác nhận trước khi sửa. Chỉ thanh toán sau khi nghiệm thu hài lòng.
          </p>
        </aside>
      </div>
    </main>
  );
}
