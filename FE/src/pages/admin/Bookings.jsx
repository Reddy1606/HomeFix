import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAdminBookings } from '../../api/admin';
import useAdminResource from '../../hooks/useAdminResource';
import {
  Pagination,
  ResourceState,
  StatusBadge,
} from '../../components/admin/AdminUI';
import { BOOKING_STATUS, dateLabel, money } from '../../utils/admin';
import BookingEditor from '../../components/admin/BookingEditor';
import { formatBookingCode } from '../../utils/bookingCode';


export default function Bookings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const query = searchParams.get('search') || '';
  const [search, setSearch] = useState(query);
  const resource = useAdminResource(fetchAdminBookings, {
    page,
    limit: 10,
    ...(status && { status }),
    ...(query && { search: query }),
  });
  const rows = resource.data?.bookings || [];
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState('');
  const filter = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) =>
      value ? next.set(key, String(value)) : next.delete(key)
    );
    setSearchParams(next);
  };
  const open = (booking) => { setNotice(''); setSelected(booking); };

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="hf-eyebrow">ĐIỀU PHỐI & THEO DÕI</span>
          <h1>Quản lý đơn hàng</h1>
          <p>Kiểm tra lịch hẹn và cập nhật tiến độ sửa chữa.</p>
        </div>
        <button
          className="hf-button secondary"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          ↻ Làm mới
        </button>
      </div>
      {notice && (
        <div className="hf-notice success" role="status">
          {notice}
        </div>
      )}
      <section className="hf-card">
        <div className="admin-toolbar">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              filter({ search: search.trim(), page: '' });
            }}
            className="admin-search"
          >
            <label className="sr-only" htmlFor="booking-search">
              Tìm đơn hàng
            </label>
            <input
              id="booking-search"
              placeholder="Mã đơn, tên hoặc số điện thoại…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button className="hf-button secondary small">Tìm kiếm</button>
          </form>
          <label className="admin-select-label">
            Trạng thái
            <select
              value={status}
              onChange={(event) =>
                filter({ status: event.target.value, page: '' })
              }
            >
              <option value="">Tất cả trạng thái</option>
              {Object.entries(BOOKING_STATUS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ResourceState {...resource} empty={!rows.length} />
        {!resource.loading && !resource.error && rows.length > 0 && (
          <div className="hf-table-wrap">
            <table className="hf-table">
              <thead>
                <tr>
                  <th scope="col">Mã đơn</th>
                  <th scope="col">Khách hàng</th>
                  <th scope="col">Dịch vụ / Lịch hẹn</th>
                  <th scope="col">Tổng tiền</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <span className="booking-id font-bold text-gray-800" title={booking.id}>
                        {formatBookingCode(booking)}
                      </span>
                      <span className="table-subtitle">
                        {dateLabel(booking.created_at)}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {booking.contact_name ||
                          booking.customer?.full_name ||
                          'Khách hàng'}
                      </strong>
                      <span className="table-subtitle">
                        {booking.contact_phone ||
                          booking.customer?.phone ||
                          'Chưa có SĐT'}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {booking.services?.name || 'Dịch vụ sửa chữa'}
                      </strong>
                      <span className="table-subtitle">
                        {booking.booking_type === 'immediate'
                          ? 'Gọi thợ ngay'
                          : dateLabel(booking.scheduled_at)}
                      </span>
                    </td>
                    <td>{money(booking.total_price)}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <StatusBadge status={booking.status} />
                        {(booking.is_priority || (typeof booking.description === 'string' && booking.description.includes('ƯU TIÊN VIP'))) && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>
                            ⚡ VIP ƯU TIÊN
                          </span>
                        )}
                        {(booking.is_warranty_claim || booking.status === 'warranty_claim' || (typeof booking.description === 'string' && booking.description.includes('BẢO HÀNH'))) && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>
                            🛡️ BẢO HÀNH
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="hf-table-action"
                        onClick={() => open(booking)}
                        aria-label={`Xem đơn ${formatBookingCode(booking)}`}
                      >
                        Chi tiết →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!resource.loading && !resource.error && (
          <Pagination
            pagination={resource.data?.pagination}
            page={page}
            onChange={(next) => filter({ page: next })}
          />
        )}
      </section>
      {selected && <BookingEditor key={selected.id} id={selected.id}
        onClose={() => setSelected(null)}
        onSaved={(message) => { setSelected(null); setNotice(message); resource.reload(); }} />}
    </>
  );
}
