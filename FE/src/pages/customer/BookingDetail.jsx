import { useToast } from '../../context/ToastContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BookingReview from '../../components/common/BookingReview';
import { submitBookingReview } from '../../api/reviews';
import { fetchBookingById, cancelBooking } from '../../api/bookings';
import { formatPrice } from '../../api/services';

const STATUS_STEPS = [
  { key: 'pending', label: '1. Tiếp nhận đơn' },
  { key: 'confirmed', label: '2. Đã gán thợ' },
  { key: 'in_progress', label: '3. Đang sửa chữa' },
  { key: 'completed', label: '4. Hoàn thành' },
];

const STATUS_DETAILS = {
  pending: { label: 'Chờ điều phối thợ', color: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Thợ đang chuẩn bị đến', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Thợ đang tiến hành sửa', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Đơn hàng hoàn tất', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đơn hàng đã hủy', color: 'bg-gray-100 text-gray-700' },
  warranty_claim: { label: 'Yêu cầu bảo hành', color: 'bg-rose-100 text-rose-800' },
};

function formatDate(isoStr) {
  if (!isoStr) return 'Chưa có thông tin';
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return isoStr;
  }
}

export default function BookingDetail() {
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError('');

    fetchBookingById(id)
      .then((data) => {
        if (mounted) setBooking(data);
      })
      .catch((err) => {
        // Fallback localStorage
        try {
          const saved = JSON.parse(localStorage.getItem('homefix_bookings') || '[]');
          const found = saved.find((item) => String(item.id) === String(id));
          if (found && mounted) {
            setBooking(found);
            return;
          }
        } catch (e) {
          // ignore
        }
        if (mounted) {
          setError(err.response?.data?.message || 'Không tìm thấy thông tin đơn đặt lịch.');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;
    setCanceling(true);
    try {
      await cancelBooking(id);
      setBooking((prev) => ({ ...prev, status: 'cancelled', can_cancel: false }));
      alert('Đã hủy đơn hàng thành công.');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy đơn. Vui lòng thử lại.');
    } finally {
      setCanceling(false);
    }
  };


const handleSubmitReview = async ({ bookingId, rating, comment }) => {
  try {
    const result = await submitBookingReview(bookingId, {
      rating,
      comment
    });

    showToast('Đánh giá thợ sửa chữa thành công!', 'success');

    return result;
  } catch (error) {
    showToast(
      error.message || 'Không thể gửi đánh giá. Vui lòng thử lại.',
      'error'
    );

    throw error;
  }
};


  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4" />
        <p className="text-gray-600">Đang tải chi tiết đơn hàng...</p>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy thông tin đơn hàng</h2>
        <p className="mt-2 text-gray-600 max-w-md mx-auto">
          {error || 'Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.'}
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            to="/my-bookings"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            ← Quay lại lịch sử đặt lịch
          </Link>
        </div>
      </main>
    );
  }

  const statusInfo = STATUS_DETAILS[booking.status] || {
    label: booking.status,
    color: 'bg-gray-100 text-gray-700',
  };
  const service = booking.services || booking.service || {};
  const serviceName = typeof service === 'string' ? service : service.name || 'Dịch vụ sửa chữa';
  const price = booking.total_price || service.base_price;
  const technician = booking.technician;
  const canCancel = booking.can_cancel ?? ['pending', 'confirmed'].includes(booking.status);

  // Tính index của timeline
  const stepIndex = ['pending', 'confirmed', 'in_progress', 'completed'].indexOf(booking.status);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {/* Nút quay lại */}
      <div className="mb-6">
        <Link
          to="/my-bookings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-blue-600"
        >
          ← Quay lại danh sách đơn hàng
        </Link>
      </div>

      {/* Header chi tiết */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <span className="text-xs font-mono font-medium text-gray-400">Mã đơn hàng</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-0.5">
              #{String(booking.id).slice(0, 8)}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              Thời điểm tạo: {formatDate(booking.created_at || booking.createdAt)}
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-1.5 text-sm font-bold ${statusInfo.color}`}
          >
            ● {statusInfo.label}
          </span>
        </div>

        {/* Tiến trình sửa chữa (Timeline) */}
        {booking.status !== 'cancelled' && (
          <div className="my-8">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Tiến trình thực hiện</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUS_STEPS.map((step, idx) => {
                const isPassed = stepIndex >= idx;
                const isCurrent = stepIndex === idx;
                return (
                  <div
                    key={step.key}
                    className={`rounded-xl p-3 border text-center transition ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-sm'
                        : isPassed
                        ? 'border-green-300 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    <div className="text-xs">{step.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Thông tin dịch vụ & thợ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Cột trái: Chi tiết dịch vụ */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
              🛠️ Thông tin dịch vụ
            </h3>
            <div>
              <span className="text-xs text-gray-500 block">Dịch vụ sửa chữa:</span>
              <strong className="text-gray-900 text-lg">{serviceName}</strong>
            </div>

            <div>
              <span className="text-xs text-gray-500 block">Hình thức đặt:</span>
              <span className="text-gray-800">
                {booking.booking_type === 'immediate'
                  ? '⚡ Đặt thợ đến ngay (trong 15-30 phút)'
                  : `📅 Lịch hẹn: ${formatDate(booking.scheduled_at || booking.date)}`}
              </span>
            </div>

            <div>
              <span className="text-xs text-gray-500 block">Địa chỉ thực hiện:</span>
              <p className="text-gray-800 font-medium">📍 {booking.address || 'Chưa cung cấp'}</p>
            </div>

            {booking.description && (
              <div>
                <span className="text-xs text-gray-500 block">Mô tả sự cố của bạn:</span>
                <p className="text-gray-700 bg-gray-50 rounded-lg p-3 text-sm italic">
                  "{booking.description}"
                </p>
              </div>
            )}
          </div>

          {/* Cột phải: Thợ phụ trách & Chi phí */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
              🧑‍🔧 Thợ phụ trách & Chi phí
            </h3>

            {technician ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    {technician.full_name ? technician.full_name.charAt(0).toUpperCase() : 'T'}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{technician.full_name}</h4>
                    <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      ✓ Đã xác minh KYC
                    </span>
                  </div>
                </div>
                {technician.phone && (
                  <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between">
                    <span className="text-xs text-gray-600">Số điện thoại liên hệ:</span>
                    <a
                      href={`tel:${technician.phone}`}
                      className="font-bold text-blue-700 hover:underline"
                    >
                      📞 {technician.phone}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center text-gray-500 text-sm">
                ⏳ Đang tìm và điều phối thợ phù hợp nhất gần khu vực của bạn...
              </div>
            )}

            <div className="rounded-xl bg-gray-50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Chi phí dịch vụ:</span>
                <strong className="text-gray-900">
                  {price ? formatPrice(price) : 'Báo giá sau kiểm tra'}
                </strong>
              </div>

              {service.warranty_days && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thời hạn bảo hành:</span>
                  <span className="font-medium text-emerald-700">
                    🛡️ {service.warranty_days} ngày sửa lại miễn phí
                  </span>
                </div>
              )}

              {booking.warranty_until && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Hạn bảo hành đến:</span>
                  <span className="font-bold text-emerald-800">
                    {booking.warranty_until}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
{/* Đánh giá thợ sau khi hoàn thành đơn */}
{booking.status === 'completed' && (
  <div className="mt-8 border-t border-gray-100 pt-6">
    <BookingReview
      bookingId={booking.id}
      status={booking.status}
      onSubmitReview={handleSubmitReview}
    />
  </div>
)}


        {/* Các nút thao tác */}
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/my-bookings"
            className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            ← Danh sách đơn
          </Link>

          {canCancel && (
            <button
              type="button"
              disabled={canceling}
              onClick={handleCancel}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {canceling ? 'Đang hủy đơn...' : 'Hủy đơn đặt lịch này'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
