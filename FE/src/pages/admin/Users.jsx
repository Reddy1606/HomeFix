import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchAdminUsers,
  verifyTechnician,
  toggleUserStatus,
} from '../../api/admin';
import useAdminResource from '../../hooks/useAdminResource';
import {
  Pagination,
  ResourceState,
} from '../../components/admin/AdminUI';
import Modal from '../../components/admin/Modal';
import { dateLabel } from '../../utils/admin';

const ROLE_LABELS = {
  customer: { label: 'Khách hàng', color: '#0284c7', bg: '#f0f9ff' },
  technician: { label: 'Thợ sửa chữa', color: '#d97706', bg: '#fffbeb' },
  admin: { label: 'Quản trị viên', color: '#7c3aed', bg: '#f5f3ff' },
};

export default function Users() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get('role') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const query = searchParams.get('search') || '';
  const [search, setSearch] = useState(query);

  const resource = useAdminResource(fetchAdminUsers, {
    page,
    limit: 10,
    ...(role && { role }),
    ...(query && { search: query }),
  });

  const users = resource.data?.users || [];
  const pagination = resource.data?.pagination || null;

  const [selectedUser, setSelectedUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const filter = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) =>
      value ? next.set(key, String(value)) : next.delete(key)
    );
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    filter({ search: search.trim(), page: 1 });
  };

  const handleVerify = async (user, newStatus) => {
    const actionText = newStatus ? 'xác minh KYC cho thợ' : 'hủy xác minh thợ';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} "${user.full_name}" không?`)) return;

    setBusy(true);
    setNotice('');
    setError('');
    try {
      await verifyTechnician(user.id, newStatus);
      setNotice(`Đã ${actionText} thành công!`);
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => ({
          ...prev,
          is_verified: newStatus,
          skill_verified: newStatus,
        }));
      }
      resource.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật xác minh.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextActive = !user.is_active;
    const actionText = nextActive ? 'mở khóa tài khoản' : 'khóa tài khoản';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} của "${user.full_name}" không?`)) return;

    setBusy(true);
    setNotice('');
    setError('');
    try {
      await toggleUserStatus(user.id, nextActive);
      setNotice(`Đã ${actionText} thành công!`);
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => ({ ...prev, is_active: nextActive }));
      }
      resource.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái.');
    } finally {
      setBusy(false);
    }
  };

  // Tính số liệu nhanh trên trang hiện tại
  const countCustomer = users.filter((u) => u.role === 'customer').length;
  const countTech = users.filter((u) => u.role === 'technician').length;
  const countVerified = users.filter((u) => u.role === 'technician' && u.is_verified).length;

  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="hf-eyebrow">QUẢN TRỊ TÀI KHOẢN</span>
          <h1>Quản lý người dùng</h1>
          <p>Danh sách khách hàng, thợ sửa chữa, xác minh hồ sơ KYC và phân quyền hệ thống.</p>
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
        <div style={{ background: '#f0fdf4', color: '#166534', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #bbf7d0', fontWeight: 600 }}>
          ✅ {notice}
        </div>
      )}

      {error && (
        <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #fecaca', fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <article className="hf-card stat-card">
          <div>
            <p>Tổng tài khoản</p>
            <strong>{pagination?.total ?? users.length}</strong>
          </div>
          <span className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>👥</span>
        </article>

        <article className="hf-card stat-card">
          <div>
            <p>Khách hàng (trang này)</p>
            <strong>{countCustomer}</strong>
          </div>
          <span className="stat-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>🛍️</span>
        </article>

        <article className="hf-card stat-card">
          <div>
            <p>Thợ sửa chữa (trang này)</p>
            <strong>{countTech}</strong>
          </div>
          <span className="stat-icon" style={{ background: '#fffbeb', color: '#d97706' }}>🔧</span>
        </article>

        <article className="hf-card stat-card">
          <div>
            <p>Thợ đã xác minh KYC</p>
            <strong>{countVerified}</strong>
          </div>
          <span className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>✓</span>
        </article>
      </div>

      <div className="hf-card">
        <form className="admin-toolbar" onSubmit={handleSearchSubmit}>
          <div className="admin-search">
            <input
              className="hf-input"
              value={search}
              placeholder="Tìm theo tên, email hoặc số điện thoại..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label className="admin-select-label">
            <span>Vai trò</span>
            <select
              className="hf-select"
              value={role}
              onChange={(e) => filter({ role: e.target.value, page: 1 })}
            >
              <option value="">Tất cả vai trò</option>
              <option value="customer">Khách hàng</option>
              <option value="technician">Thợ sửa chữa</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </label>

          <button className="hf-button secondary" type="submit">
            Tìm kiếm
          </button>

          {(role || query) && (
            <button
              className="hf-button secondary"
              type="button"
              onClick={() => {
                setSearch('');
                setSearchParams({});
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </form>

        <ResourceState {...resource} empty={users.length === 0} />

        {users.length > 0 && (
          <>
            <div className="hf-table-wrap">
              <table className="hf-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Liên hệ</th>
                    <th>Vai trò</th>
                    <th>Xác minh KYC</th>
                    <th>Trạng thái</th>
                    <th>Ngày tham gia</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const roleInfo = ROLE_LABELS[u.role] || {
                      label: u.role,
                      color: '#475569',
                      bg: '#f1f5f9',
                    };
                    const isActive = u.is_active !== false;

                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: roleInfo.bg,
                                color: roleInfo.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                border: `1px solid ${roleInfo.color}33`,
                              }}
                            >
                              {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <strong style={{ display: 'block', fontSize: '0.88rem' }}>
                                {u.full_name || 'Chưa đặt tên'}
                              </strong>
                              <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                #{String(u.id).slice(0, 8)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.82rem' }}>
                            <div style={{ color: '#334155' }}>📧 {u.email}</div>
                            <div style={{ color: '#64748b', marginTop: '2px' }}>
                              📞 {u.phone || 'Chưa có SĐT'}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: roleInfo.color,
                              background: roleInfo.bg,
                              border: `1px solid ${roleInfo.color}30`,
                            }}
                          >
                            {roleInfo.label}
                          </span>
                        </td>

                        <td>
                          {u.role === 'technician' ? (
                            u.is_verified ? (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  color: '#15803d',
                                  background: '#f0fdf4',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #bbf7d0',
                                }}
                              >
                                ✓ Đã duyệt
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  color: '#b45309',
                                  background: '#fffbeb',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #fde68a',
                                }}
                              >
                                ⏳ Chờ duyệt
                              </span>
                            )
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>—</span>
                          )}
                        </td>

                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: isActive ? '#166534' : '#991b1b',
                              background: isActive ? '#dcfce7' : '#fee2e2',
                            }}
                          >
                            {isActive ? '● Đang hoạt động' : '✕ Bị khóa'}
                          </span>
                        </td>

                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {dateLabel(u.created_at)}
                        </td>

                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="hf-button secondary small"
                              onClick={() => setSelectedUser(u)}
                            >
                              Chi tiết
                            </button>

                            {u.role === 'technician' && (
                              <button
                                type="button"
                                disabled={busy}
                                className="hf-button small"
                                style={{
                                  background: u.is_verified ? '#f59e0b' : '#16a34a',
                                  borderColor: 'transparent',
                                }}
                                onClick={() => handleVerify(u, !u.is_verified)}
                              >
                                {u.is_verified ? 'Hủy duyệt' : 'Duyệt KYC'}
                              </button>
                            )}

                            {u.role !== 'admin' && (
                              <button
                                type="button"
                                disabled={busy}
                                className="hf-button secondary small"
                                style={{
                                  color: isActive ? '#dc2626' : '#16a34a',
                                  borderColor: isActive ? '#fecaca' : '#bbf7d0',
                                }}
                                onClick={() => handleToggleStatus(u)}
                              >
                                {isActive ? 'Khóa' : 'Mở khóa'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              pagination={pagination}
              page={page}
              onChange={(next) => filter({ page: next })}
            />
          </>
        )}
      </div>

      {/* Modal xem chi tiết người dùng */}
      {selectedUser && (
        <Modal
          title={`Chi tiết tài khoản #${String(selectedUser.id).slice(0, 8)}`}
          onClose={() => setSelectedUser(null)}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px 16px', fontSize: '0.88rem' }}>
            <span style={{ color: '#64748b' }}>Họ và tên:</span>
            <strong>{selectedUser.full_name || 'Chưa đặt tên'}</strong>

            <span style={{ color: '#64748b' }}>Email:</span>
            <span>{selectedUser.email}</span>

            <span style={{ color: '#64748b' }}>Số điện thoại:</span>
            <span>{selectedUser.phone || 'Chưa cập nhật'}</span>

            <span style={{ color: '#64748b' }}>Địa chỉ:</span>
            <span>{selectedUser.address || 'Chưa cập nhật địa chỉ'}</span>

            <span style={{ color: '#64748b' }}>Vai trò:</span>
            <div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: ROLE_LABELS[selectedUser.role]?.color || '#334155',
                  background: ROLE_LABELS[selectedUser.role]?.bg || '#f1f5f9',
                }}
              >
                {ROLE_LABELS[selectedUser.role]?.label || selectedUser.role}
              </span>
            </div>

            {selectedUser.role === 'technician' && (
              <>
                <span style={{ color: '#64748b' }}>Xác minh KYC:</span>
                <strong>
                  {selectedUser.is_verified ? '✅ Đã xác minh đủ điều kiện nhận đơn' : '⏳ Chưa được duyệt hồ sơ'}
                </strong>

                <span style={{ color: '#64748b' }}>Đánh giá thợ:</span>
                <span>⭐ {selectedUser.rating_avg ? `${selectedUser.rating_avg} / 5` : 'Chưa có lượt đánh giá nào'}</span>
              </>
            )}

            <span style={{ color: '#64748b' }}>Trạng thái:</span>
            <span>{selectedUser.is_active !== false ? '🟢 Bình thường' : '🔴 Bị khóa'}</span>

            <span style={{ color: '#64748b' }}>Ngày đăng ký:</span>
            <span>{dateLabel(selectedUser.created_at)}</span>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            {selectedUser.role === 'technician' && (
              <button
                type="button"
                disabled={busy}
                className="hf-button small"
                style={{
                  background: selectedUser.is_verified ? '#f59e0b' : '#16a34a',
                }}
                onClick={() => handleVerify(selectedUser, !selectedUser.is_verified)}
              >
                {selectedUser.is_verified ? 'Hủy duyệt thợ' : 'Phê duyệt KYC thợ'}
              </button>
            )}

            <button
              type="button"
              className="hf-button secondary small"
              onClick={() => setSelectedUser(null)}
            >
              Đóng
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
