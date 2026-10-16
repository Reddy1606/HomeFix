import { useState } from 'react';
import { loadTechnicians } from '../../api/adminData';
import useAdminResource from '../../hooks/useAdminResource';
import { ResourceState } from './AdminUI';

export default function TechnicianPicker({ selectedId, onSelect, disabled }) {
  const resource = useAdminResource(loadTechnicians);
  const [search, setSearch] = useState('');
  const term = search.trim().toLocaleLowerCase('vi');
  const rows = (resource.data || []).filter((u) =>
    `${u.full_name} ${u.phone || ''} ${u.email || ''}`.toLocaleLowerCase('vi').includes(term));
  // A reload clears the selection so a previously eligible account cannot be submitted unseen.
  const reload = () => { onSelect(null); resource.reload(); };
  return (
    <section className="technician-picker" aria-label="Chọn thợ điều phối">
      <div className="picker-heading"><h3>Chọn thợ điều phối</h3>
        <button type="button" className="hf-table-action" disabled={disabled || resource.loading} onClick={reload}>Làm mới danh sách</button>
      </div>
      <p className="hf-hint">Chỉ hiển thị thợ đang hoạt động, đã KYC và chưa có đơn xác nhận, đang sửa hoặc bảo hành. Danh sách chưa kiểm tra trùng giờ hẹn.</p>
      <label className="hf-field">Tìm thợ
        <input type="search" placeholder="Tên, số điện thoại hoặc email" value={search}
          disabled={disabled} onChange={(event) => setSearch(event.target.value)} />
      </label>
      <ResourceState {...resource} reload={reload} />
      {!resource.loading && !resource.error && (rows.length ? (
        <fieldset className="technician-list" disabled={disabled}>
          <legend className="sr-only">Danh sách thợ khả dụng</legend>
          {rows.map((user) => (
            <label className={`technician-option${selectedId === user.id ? ' selected' : ''}`} key={user.id}>
              <input type="radio" name="technician" value={user.id} checked={selectedId === user.id}
                onChange={() => onSelect(user)} />
              <span><strong>{user.full_name}</strong><span className="table-subtitle">{user.phone || user.email}</span>
                <span className="table-subtitle">Đã KYC · {user.rating_avg == null ? 'Chưa có đánh giá' : `${user.rating_avg}/5 sao`}</span></span>
            </label>
          ))}
        </fieldset>
      ) : <p role="status">{resource.data?.length ? 'Không có thợ khớp tìm kiếm.' : 'Chưa có thợ phù hợp để điều phối. Hãy kiểm tra KYC hoặc thử lại sau.'}</p>)}
    </section>
  );
}
