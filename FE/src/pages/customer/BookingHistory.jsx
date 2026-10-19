import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { fetchMyBookings, cancelBooking } from '../../api/bookings';
import { formatPrice } from '../../api/services';
import { formatBookingCode } from '../../utils/bookingCode';

const STATUS_MAP = {
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: { label: 'Đã xác nhận & gán thợ', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  in_progress: { label: 'Thợ đang sửa', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  completed: { label: 'Đã hoàn thành', color: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  warranty_claim: { label: 'Yêu cầu bảo hành', color: 'bg-rose-100 text-rose-800 border-rose-200' },
};

function formatDate(isoStr) {
  if (!isoStr) return 'Chưa xác định';
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return isoStr;
  }
}

export default function BookingHistory() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelingId, setCancelingId] = useState(null);

  const loadData = async (status = '') => {
    setLoading(true);
    setError('');
    try {
      if (!user) {
        // Nếu chưa đăng nhập, xem thử fallback từ localStorage
        const saved = JSON.parse(localStorage.getItem('homefix_bookings') || '[]');
        setItems(saved);
        setLoading(false);
        return;
      }

      const res = await fetchMyBookings(status ? { status } : {});
      const list = Array.isArray(res?.bookings) ? res.bookings : [];
      setItems(list);
    } catch (err) {
      console.error('Lỗi tải lịch sử:', err);
      // Fallback localStorage
      const saved = JSON.parse(localStorage.getItem('homefix_bookings') || '[]');
      if (saved.length > 0) {
        setItems(saved);
      } else {
        setError(err.response?.data?.message || 'Không thể tải lịch sử đơn hàng từ máy chủ.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(statusFilter);
  }, [user, statusFilter]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu đặt lịch này không?')) return;
    setCancelingId(bookingId);
    try {
      await cancelBooking(bookingId);
      // Cập nhật lại UI cục bộ
      setItems((prev) =>
        prev.map((item) =>
          item.id === bookingId ? { ...item, status: 'cancelled', can_cancel: false } : item
        )
      );
      alert('Đã hủy yêu cầu đặt lịch thành công.');
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể hủy đơn. Vui lòng thử lại sau.');
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Lịch sử đặt lịch</h1>
          <p className="mt-1 text-sm text-gray-600">
            Theo dõi tiến độ thợ sửa chữa và lịch hẹn của {user?.full_name || user?.name || 'bạn'}.
          </p>
        </div>
        <Link
          to="/booking"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <span>+ Đặt lịch mới</span>
        </Link>
      </div>

      {!user && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
          💡 Bạn chưa đăng nhập. Để lưu đơn vĩnh viễn và theo dõi thợ, hãy{' '}
          <Link to="/login?redirect=/my-bookings" className="font-bold underline">
            đăng nhập tài khoản
          </Link>
          .
        </div>
      )}

      {/* Tabs lọc trạng thái */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-gray-100 pb-4">
        {[
          { label: 'Tất cả', value: '' },
          { label: 'Chờ xác nhận', value: 'pending' },
          { label: 'Đã gán thợ', value: 'confirmed' },
          { label: 'Đang sửa', value: 'in_progress' },
          { label: 'Hoàn thành', value: 'completed' },
          { label: 'Đã hủy', value: 'cancelled' },
        ].map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="mt-12 text-center text-gray-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-3" />
          <p>Đang tải danh sách đặt lịch...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="mt-12 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🛠️</div>
          <h3 className="text-lg font-bold text-gray-900">Chưa có lịch đặt thợ nào</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            Khi bạn đặt lịch sửa điện, nước, máy lạnh..., toàn bộ tiến độ sẽ được cập nhật chi tiết tại đây.
          </p>
          <Link
            to="/booking"
            className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Đặt thợ ngay bây giờ
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((item) => {
            const statusCfg = STATUS_MAP[item.status] || {
              label: item.status || 'Chờ xác nhận',
              color: 'bg-gray-100 text-gray-700 border-gray-200',
            };
            const serviceName =
              item.services?.name || item.service?.name || item.service || 'Dịch vụ sửa chữa';
            const price = item.total_price || item.services?.base_price;
            const canCancel = item.can_cancel ?? ['pending', 'confirmed'].includes(item.status);

            return (
              <article
                key={item.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {formatBookingCode(item)}
                      </span>
                      <h2 className="text-lg font-bold text-gray-900">{serviceName}</h2>
                      {(item.is_priority || item.description?.includes('ƯU TIÊN VIP')) && (
                        <span className="rounded-full bg-gradient-to-r from-amber-500 to-yellow-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                          ⚡ ĐƠN VIP ƯU TIÊN SỚM
                        </span>
                      )}
                      {(item.is_warranty_claim || item.status === 'warranty_claim' || item.description?.includes('BẢO HÀNH')) && (
                        <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-sm">
                          🛡️ BẢO HÀNH
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Tạo lúc: {formatDate(item.created_at || item.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${statusCfg.color}`}
                  >
                    ● {statusCfg.label}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm bg-gray-50 rounded-xl p-4">
                  <div>
                    <span className="text-gray-500 block text-xs">Hình thức & Ngày hẹn:</span>
                    <strong className="text-gray-800">
                      {item.booking_type === 'immediate'
                        ? '⚡ Thợ đến ngay'
                        : `📅 ${formatDate(item.scheduled_at || item.date)}`}
                    </strong>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-xs">Địa chỉ sửa chữa:</span>
                    <span className="text-gray-800 truncate block" title={item.address}>
                      📍 {item.address || 'Chưa có địa chỉ'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-xs">Chi phí dự kiến:</span>
                    <strong className="text-blue-600">
                      {price ? formatPrice(price) : 'Báo giá sau kiểm tra'}
                    </strong>
                  </div>
                </div>

                {item.description && (
                  <p className="mt-3 text-xs text-gray-600 italic">
                    Ghi chú sự cố: "{item.description}"
                  </p>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                  <Link
                    to={`/my-bookings/${item.id}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Xem chi tiết tiến độ đơn →
                  </Link>

                  {canCancel && (
                    <button
                      type="button"
                      disabled={cancelingId === item.id}
                      onClick={() => handleCancel(item.id)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancelingId === item.id ? 'Đang hủy...' : 'Hủy lịch hẹn'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
