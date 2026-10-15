import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchAdminBookings, updateBookingStatus } from '../../api/admin';
import useAdminResource from '../../hooks/useAdminResource';
import {
  Pagination,
  ResourceState,
  StatusBadge,
} from '../../components/admin/AdminUI';
import { BOOKING_STATUS, dateLabel, money } from '../../utils/admin';
import Modal from '../../components/admin/Modal';
import { apiError } from '../../utils/validation';

// Các bước thông thường; backend vẫn là nơi kiểm tra quy tắc chuyển trạng thái.
const nextStatuses = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  warranty_claim: [],
};

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
  const [nextStatus, setNextStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const filter = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) =>
      value ? next.set(key, String(value)) : next.delete(key)
    );
    setSearchParams(next);
  };
  const open = (booking) => {
    setSelected(booking);
    setNextStatus('');
    setError('');
  };
  async function save(event) {
    event.preventDefault();
    if (!nextStatus || busy) return;
    setBusy(true);
    setError('');
    try {
      await updateBookingStatus(selected.id, nextStatus);
      setSelected(null);
      setNotice('Đã cập nhật trạng thái đơn hàng.');
      resource.reload();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

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
                      <span className="booking-id" title={booking.id}>
                        #{String(booking.id).slice(0, 8)}
                      </span>
                      <span className="table-subtitle">
                        {dateLabel(booking.created_at)}
                      </span>
                    </td>
                    <td>
                      <strong>
                        {booking.contact_name ||
                          booking.users?.full_name ||
                          'Khách hàng'}
                      </strong>
                      <span className="table-subtitle">
                        {booking.contact_phone ||
                          booking.users?.phone ||
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
                      <StatusBadge status={booking.status} />
                    </td>
                    <td>
                      <button
                        className="hf-table-action"
                        onClick={() => open(booking)}
                        aria-label={`Xem đơn ${String(booking.id).slice(0, 8)}`}
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
      {selected && (
        <Modal
          title="Chi tiết đơn hàng"
          busy={busy}
          onClose={() => setSelected(null)}
        >
          <p className="hf-muted break-word">Mã đơn: {selected.id}</p>
          <StatusBadge status={selected.status} />
          <dl className="booking-details">
            <dt>Khách hàng</dt>
            <dd>
              {selected.contact_name || selected.users?.full_name || 'Chưa có'}
            </dd>
            <dt>Số điện thoại</dt>
            <dd>
              {selected.contact_phone || selected.users?.phone || 'Chưa có'}
            </dd>
            <dt>Dịch vụ</dt>
            <dd>{selected.services?.name || 'Chưa có'}</dd>
            <dt>Địa chỉ</dt>
            <dd>{selected.address}</dd>
            <dt>Lịch hẹn</dt>
            <dd>
              {selected.booking_type === 'immediate'
                ? 'Gọi thợ ngay'
                : dateLabel(selected.scheduled_at)}
            </dd>
            <dt>Ghi chú</dt>
            <dd>{selected.description || 'Không có'}</dd>
            <dt>Tổng tiền</dt>
            <dd>{money(selected.total_price)}</dd>
            <dt>Bảo hành đến</dt>
            <dd>{selected.warranty_until || 'Chưa kích hoạt'}</dd>
          </dl>
          {error && (
            <div className="hf-notice error" role="alert">
              {error}
            </div>
          )}
          {(nextStatuses[selected.status] || []).length ? (
            <form onSubmit={save}>
              <label className="hf-field">
                Cập nhật trạng thái
                <select
                  required
                  value={nextStatus}
                  disabled={busy}
                  onChange={(event) => setNextStatus(event.target.value)}
                >
                  <option value="">Chọn trạng thái mới</option>
                  {nextStatuses[selected.status].map((key) => (
                    <option key={key} value={key}>
                      {BOOKING_STATUS[key]}
                    </option>
                  ))}
                </select>
              </label>
              {nextStatus && (
                <p className="hf-hint">
                  Xác nhận chuyển đơn sang “{BOOKING_STATUS[nextStatus]}”.
                </p>
              )}
              <div className="modal-actions">
                <button
                  type="button"
                  disabled={busy}
                  className="hf-button secondary"
                  onClick={() => setSelected(null)}
                >
                  Đóng
                </button>
                <button className="hf-button" disabled={busy || !nextStatus}>
                  {busy ? 'Đang cập nhật…' : 'Xác nhận cập nhật'}
                </button>
              </div>
            </form>
          ) : (
            <p className="hf-hint">
              Đơn ở trạng thái này không có thao tác cập nhật thông thường.
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
