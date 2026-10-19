import { useState } from 'react';
import { fetchAdminBookingById, updateBookingStatus } from '../../api/admin';
import useAdminResource from '../../hooks/useAdminResource';
import { BOOKING_STATUS, dateLabel, money } from '../../utils/admin';
import { apiError } from '../../utils/validation';
import { AdminDataError } from '../../utils/adminAnalytics';
import { loadTechnicians } from '../../api/adminData';
import Modal from './Modal';
import { ResourceState, StatusBadge } from './AdminUI';
import TechnicianPicker from './TechnicianPicker';
import { formatBookingCode } from '../../utils/bookingCode';

const load = ({ id }, options) => fetchAdminBookingById(id, options);
export default function BookingEditor({ id, onClose, onSaved }) {
  const resource = useAdminResource(load, { id });
  const booking = resource.data?.booking;
  const statuses = resource.data?.allowed_next_statuses || [];
  const [nextStatus, setNextStatus] = useState('');
  const [technician, setTechnician] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const assigning = nextStatus === 'confirmed';
  const reload = () => {
    setNextStatus(''); setTechnician(null); setError(''); setConflict(false); resource.reload();
  };
  async function save(event) {
    event.preventDefault();
    if (busy || conflict || !statuses.includes(nextStatus) || (assigning && !technician)) return;
    setBusy(true); setError('');
    try {
      if (assigning) {
        const eligible = await loadTechnicians();
        if (!eligible.some((user) => user.id === technician.id)) {
          throw new AdminDataError('Thợ vừa chọn không còn khả dụng. Vui lòng chọn lại.');
        }
      }
      await updateBookingStatus(id, nextStatus, assigning ? technician.id : undefined);
      onSaved(assigning ? `Đã gán ${technician.full_name} và xác nhận đơn hàng.` : 'Đã cập nhật trạng thái đơn hàng.');
    } catch (err) {
      setError(err instanceof AdminDataError ? err.message : apiError(err));
      if (err.response?.status === 409) setConflict(true);
      // Refresh eligibility after rejection; never retain an unverified selection.
      if (assigning) { setTechnician(null); setNextStatus(''); }
    } finally { setBusy(false); }
  }
  return (
    <Modal title="Chi tiết & điều phối đơn hàng" busy={busy} onClose={onClose}>
      <ResourceState {...resource} reload={reload} />
      {booking && <>
        <p className="hf-muted break-word" style={{ fontSize: '0.88rem' }}>
          Mã đơn: <strong style={{ color: '#0f172a' }}>{formatBookingCode(booking)}</strong> <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({booking.id})</span>
        </p>
        <StatusBadge status={booking.status} />
        <dl className="booking-details">
          <dt>Khách hàng</dt><dd>{booking.customer?.full_name || booking.contact_name || 'Chưa có'}</dd>
          <dt>Số điện thoại</dt><dd>{booking.customer?.phone || booking.contact_phone || 'Chưa có'}</dd>
          <dt>Dịch vụ</dt><dd>{booking.services?.name || 'Chưa có'}</dd>
          <dt>Địa chỉ</dt><dd>{booking.address}</dd>
          <dt>Lịch hẹn</dt><dd>{booking.booking_type === 'immediate' ? 'Gọi thợ ngay' : dateLabel(booking.scheduled_at)}</dd>
          <dt>Thợ phụ trách</dt><dd>{booking.technician?.full_name || 'Chưa gán thợ'}</dd>
          <dt>Ghi chú</dt><dd>{booking.description || 'Không có'}</dd>
          <dt>Tổng tiền</dt><dd>{money(booking.total_price)}</dd>
          <dt>Bảo hành đến</dt><dd>{booking.warranty_until || 'Chưa kích hoạt'}</dd>
        </dl>
        {error && <div className="hf-notice error" role="alert">{error}</div>}
        {conflict && <button type="button" className="hf-button secondary" onClick={reload}>Tải lại đơn hàng</button>}
        {statuses.length ? <form onSubmit={save}>
          <label className="hf-field">Cập nhật trạng thái
            <select required disabled={busy || conflict} value={nextStatus} onChange={(event) => {
              setNextStatus(event.target.value); setTechnician(null); setError('');
            }}>
              <option value="">Chọn trạng thái mới</option>
              {statuses.map((status) => <option key={status} value={status}>{BOOKING_STATUS[status] || status}</option>)}
            </select>
          </label>
          {assigning && <TechnicianPicker selectedId={technician?.id} onSelect={setTechnician} disabled={busy || conflict} />}
          {technician && assigning && <p className="hf-notice success" role="status">Thợ được chọn: {technician.full_name}. Đơn sẽ chuyển sang đã xác nhận khi lưu.</p>}
          <div className="modal-actions">
            <button type="button" className="hf-button secondary" disabled={busy} onClick={onClose}>Đóng</button>
            <button className="hf-button" disabled={busy || conflict || !nextStatus || (assigning && !technician)}>
              {busy ? 'Đang cập nhật…' : assigning ? 'Gán thợ & xác nhận' : 'Xác nhận cập nhật'}
            </button>
          </div>
        </form> : <p className="hf-hint">Đơn ở trạng thái này không có thao tác cập nhật.</p>}
      </>}
    </Modal>
  );
}
