import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  fetchAdminUsers,
  verifyTechnician,
  toggleUserStatus,
  updateUserRole,
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

const ROLE_DESCRIPTIONS = {
  customer: 'Khách hàng sử dụng dịch vụ, đặt lịch và thanh toán.',
  technician: 'Thợ sửa chữa tiếp nhận đơn, thực hiện công việc và hoàn tất hồ sơ KYC.',
  admin: 'Quản trị viên cấp cao, toàn quyền quản trị tài khoản và cấu hình hệ thống.',
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
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
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

  const handleOpenRoleModal = (user) => {
    setRoleModalUser(user);
    setSelectedRole(user.role);
    setError('');
  };

  const handleUpdateRole = async (user, targetRole) => {
    if (!targetRole || targetRole === user.role) return;
    const targetLabel = ROLE_LABELS[targetRole]?.label || targetRole;
    if (!window.confirm(`Bạn có chắc chắn muốn chuyển vai trò của "${user.full_name}" sang "${targetLabel}" không?`)) return;

    setBusy(true);
    setNotice('');
    setError('');
    try {
      await updateUserRole(user.id, targetRole);
      setNotice(`Đã đổi vai trò của "${user.full_name}" sang "${targetLabel}" thành công!`);
      if (selectedUser?.id === user.id) {
        setSelectedUser((prev) => ({ ...prev, role: targetRole }));
      }
      setRoleModalUser(null);
      resource.reload();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật vai trò.');
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
                            ) : u.cccd_image || u.cccd_number || u.criminal_record_url ? (
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
                                ⏳ Chờ duyệt KYC
                              </span>
                            ) : (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  color: '#64748b',
                                  background: '#f1f5f9',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                }}
                              >
                                Chưa nộp hồ sơ
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

                            <button
                              type="button"
                              disabled={busy}
                              className="hf-button secondary small"
                              style={{
                                color: '#0d9488',
                                borderColor: '#99f6e4',
                                background: '#f0fdfa',
                                fontWeight: 600,
                              }}
                              onClick={() => handleOpenRoleModal(u)}
                            >
                              🛡️ Phân quyền
                            </button>

                            {u.role === 'technician' && (
                              <button
                                type="button"
                                className="hf-button small"
                                style={{
                                  background: u.is_verified ? '#f59e0b' : '#16a34a',
                                  borderColor: 'transparent',
                                  fontWeight: 650,
                                }}
                                onClick={() => setSelectedUser(u)}
                              >
                                {u.is_verified ? '🔍 Hồ sơ KYC' : '🔍 Kiểm tra & Duyệt KYC'}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
              <button
                type="button"
                className="hf-button secondary small"
                style={{ padding: '2px 8px', fontSize: '0.75rem', color: '#0d9488', borderColor: '#99f6e4' }}
                onClick={() => {
                  const target = selectedUser;
                  setSelectedUser(null);
                  handleOpenRoleModal(target);
                }}
              >
                Đổi vai trò →
              </button>
            </div>

            {selectedUser.role === 'technician' && (
              <div style={{ gridColumn: 'span 2', marginTop: '8px', padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1.5px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    📋 HỒ SƠ XÁC MINH DANH TÍNH (KYC)
                  </h4>
                  {selectedUser.is_verified ? (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                      ✓ ĐÃ PHÊ DUYỆT
                    </span>
                  ) : selectedUser.cccd_image || selectedUser.cccd_number || selectedUser.criminal_record_url ? (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
                      ⏳ CHỜ ADMIN DUYỆT
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
                      CHƯA NỘP HỒ SƠ
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px 14px', fontSize: '0.85rem' }}>
                  <span style={{ color: '#64748b' }}>Số CCCD:</span>
                  <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                    {selectedUser.cccd_number ? `🪪 ${selectedUser.cccd_number}` : '⚠️ Chưa cung cấp số CCCD'}
                  </strong>

                  <span style={{ color: '#64748b' }}>Ảnh thẻ CCCD:</span>
                  <div>
                    {selectedUser.cccd_image ? (
                      <div>
                        <a href={selectedUser.cccd_image} target="_blank" rel="noreferrer" title="Click để mở ảnh kích thước lớn trong tab mới">
                          <img
                            src={selectedUser.cccd_image}
                            alt="Ảnh CCCD"
                            style={{ maxHeight: '130px', maxWidth: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'zoom-in' }}
                          />
                        </a>
                        <small style={{ display: 'block', color: '#2563eb', marginTop: '4px', fontWeight: 600 }}>
                          🔍 Nhấp vào ảnh để xem kích thước lớn ↗
                        </small>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa tải lên ảnh</span>
                    )}
                  </div>

                  <span style={{ color: '#64748b' }}>Chứng chỉ nghề:</span>
                  <div>
                    {selectedUser.criminal_record_url ? (
                      <a
                        href={selectedUser.criminal_record_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563eb', fontWeight: 700, padding: '6px 12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', textDecoration: 'none' }}
                      >
                        📄 Mở xem chứng chỉ đã nộp ↗
                      </a>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa nộp chứng chỉ</span>
                    )}
                  </div>

                  <span style={{ color: '#64748b' }}>Đánh giá thợ:</span>
                  <span>⭐ {selectedUser.rating_avg ? `${selectedUser.rating_avg} / 5` : 'Chưa có lượt đánh giá nào'}</span>
                </div>
              </div>
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

      {/* Modal điều chỉnh phân quyền (Khách hàng / Thợ sửa chữa / Quản trị viên) */}
      {roleModalUser && (
        <Modal
          title={`Phân quyền tài khoản: ${roleModalUser.full_name || roleModalUser.email}`}
          onClose={() => setRoleModalUser(null)}
        >
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '16px' }}>
            Chọn vai trò mới cho tài khoản (Khách hàng, Thợ sửa chữa hoặc Quản trị viên).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            {Object.entries(ROLE_LABELS).map(([rKey, rInfo]) => {
              const isCurrent = roleModalUser.role === rKey;
              const isSelected = selectedRole === rKey;
              return (
                <label
                  key={rKey}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: `2px solid ${isSelected ? rInfo.color : '#e2e8f0'}`,
                    background: isSelected ? rInfo.bg : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="roleSelection"
                    value={rKey}
                    checked={isSelected}
                    onChange={() => setSelectedRole(rKey)}
                    style={{ marginTop: '3px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ color: rInfo.color, fontSize: '0.92rem' }}>
                        {rInfo.label}
                      </strong>
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#e2e8f0',
                            color: '#475569',
                            fontWeight: 600,
                          }}
                        >
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      {ROLE_DESCRIPTIONS[rKey]}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="hf-button secondary"
              onClick={() => setRoleModalUser(null)}
              disabled={busy}
            >
              Hủy
            </button>
            <button
              type="button"
              className="hf-button"
              disabled={busy || selectedRole === roleModalUser.role}
              onClick={() => handleUpdateRole(roleModalUser, selectedRole)}
            >
              {busy ? 'Đang cập nhật…' : `Lưu thành ${ROLE_LABELS[selectedRole]?.label || selectedRole}`}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
