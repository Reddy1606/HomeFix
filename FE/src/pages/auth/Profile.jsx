import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { becomeTechnician, changePassword, updateProfile } from '../../api/auth';
import { uploadAvatar, uploadKYC } from '../../api/upload';
import FormField from '../../components/auth/FormField';
import {
  apiError,
  fieldErrors,
  isStrongPassword,
  passwordHint,
  validateProfile,
} from '../../utils/validation';

const roles = {
  admin: 'Quản trị viên',
  customer: 'Khách hàng',
  technician: 'Thợ sửa chữa',
};

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const [tab, setTab] = useState('profile'); // 'profile' | 'password' | 'kyc'
  const fileInputRef = useRef(null);

  const [values, setValues] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // State cho KYC thợ
  const [kycNumber, setKycNumber] = useState(user?.cccd_number || '');
  const [cccdFile, setCccdFile] = useState(null);
  const [certFile, setCertFile] = useState(null);

  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Đăng ký nâng cấp làm thợ sửa chữa
  const handleBecomeTechnician = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đăng ký nâng cấp tài khoản thành Đối tác Thợ HomeFix?')) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await becomeTechnician();
      setUser(res.user);
      setNotice({
        type: 'success',
        text: 'Chúc mừng bạn đã đăng ký làm thợ thành công! Hãy tải lên hồ sơ CCCD để được Admin phê duyệt nhận việc.',
      });
      setTab('kyc');
    } catch (err) {
      setNotice({ type: 'error', text: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  const change = (event) => {
    const { name, value } = event.target;
    (tab === 'profile' ? setValues : setPasswords)((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setNotice(null);
  };

  const switchTab = (next) => {
    setTab(next);
    setErrors({});
    setNotice(null);
    setPasswords({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
  };

  // Upload Avatar
  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'Kích thước ảnh tối đa là 5MB.' });
      return;
    }

    setAvatarUploading(true);
    setNotice(null);
    try {
      const res = await uploadAvatar(file);
      setUser((prev) => ({ ...prev, avatar_url: res.avatar_url }));
      setNotice({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
    } catch (err) {
      setNotice({ type: 'error', text: apiError(err) });
    } finally {
      setAvatarUploading(false);
    }
  };

  // Upload KYC CCCD
  const handleUploadCccd = async (e) => {
    e.preventDefault();
    if (!cccdFile) {
      setNotice({ type: 'error', text: 'Vui lòng chọn ảnh CCCD.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await uploadKYC(cccdFile, {
        type: 'cccd',
        cccd_number: kycNumber,
      });
      setUser((prev) => ({
        ...prev,
        cccd_image: res.document_url,
        cccd_number: kycNumber,
      }));
      setNotice({
        type: 'success',
        text: 'Đã tải lên ảnh CCCD thành công! Chờ Admin phê duyệt.',
      });
      setCccdFile(null);
    } catch (err) {
      setNotice({ type: 'error', text: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  // Upload KYC Chứng chỉ
  const handleUploadCert = async (e) => {
    e.preventDefault();
    if (!certFile) {
      setNotice({ type: 'error', text: 'Vui lòng chọn tệp chứng chỉ.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await uploadKYC(certFile, { type: 'certificate' });
      setUser((prev) => ({
        ...prev,
        criminal_record_url: res.document_url,
      }));
      setNotice({
        type: 'success',
        text: 'Đã tải lên chứng chỉ / lý lịch tư pháp thành công!',
      });
      setCertFile(null);
    } catch (err) {
      setNotice({ type: 'error', text: apiError(err) });
    } finally {
      setBusy(false);
    }
  };

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const nextErrors = tab === 'profile' ? validateProfile(values) : {};
    if (tab === 'password') {
      if (!passwords.current_password) {
        nextErrors.current_password = 'Vui lòng nhập mật khẩu hiện tại.';
      }
      if (!isStrongPassword(passwords.new_password)) {
        nextErrors.new_password = passwordHint;
      }
      if (passwords.new_password !== passwords.confirm_password) {
        nextErrors.confirm_password = 'Mật khẩu xác nhận không khớp.';
      }
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (tab === 'profile') {
        const updated = await updateProfile(values);
        setUser((prev) => ({ ...prev, ...updated }));
        setNotice({
          type: 'success',
          text: 'Đã lưu thông tin cá nhân thành công.',
        });
      } else {
        await changePassword({
          current_password: passwords.current_password,
          new_password: passwords.new_password,
        });
        setPasswords({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
        setNotice({
          type: 'success',
          text: 'Đổi mật khẩu thành công.',
        });
      }
    } catch (error) {
      setErrors(fieldErrors(error));
      setNotice({ type: 'error', text: apiError(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="account-page">
      <div className="account-container">
        <span className="hf-eyebrow">TÀI KHOẢN CỦA BẠN</span>
        <h1>Thông tin cá nhân</h1>
        <p className="hf-muted">
          Thông tin chính xác giúp HomeFix hỗ trợ bạn tốt hơn.
        </p>

        <div className="profile-layout">
          <aside className="profile-sidebar hf-card">
            {/* Avatar cá nhân */}
            <div style={{ position: 'relative', margin: '0 auto 12px', width: '84px', height: '84px' }}>
              <div
                className="profile-avatar"
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #3b82f6',
                  background: '#eff6ff',
                  fontSize: '2rem',
                }}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  user?.full_name?.trim().charAt(0).toUpperCase() || 'H'
                )}
              </div>

              {/* Nút bấm đổi ảnh */}
              <button
                type="button"
                disabled={avatarUploading}
                onClick={() => fileInputRef.current?.click()}
                title="Thay đổi ảnh đại diện"
                style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#2563eb',
                  color: '#fff',
                  border: '2px solid #fff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                {avatarUploading ? '⏳' : '📷'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarSelect}
              />
            </div>

            <h2 style={{ textAlign: 'center' }}>{user.full_name}</h2>
            <p className="hf-muted break-word" style={{ textAlign: 'center' }}>{user.email}</p>
            <div style={{ textAlign: 'center', margin: '6px 0 16px' }}>
              <span className="hf-badge">{roles[user.role] || 'Thành viên'}</span>
            </div>

            <nav aria-label="Tài khoản">
              <button
                disabled={busy}
                className={tab === 'profile' ? 'active' : ''}
                onClick={() => switchTab('profile')}
              >
                Thông tin cá nhân
              </button>
              <button
                disabled={busy}
                className={tab === 'password' ? 'active' : ''}
                onClick={() => switchTab('password')}
              >
                Đổi mật khẩu
              </button>

              {user.role === 'technician' && (
                <button
                  disabled={busy}
                  className={tab === 'kyc' ? 'active' : ''}
                  onClick={() => switchTab('kyc')}
                >
                  Xác minh hồ sơ thợ (KYC)
                </button>
              )}

              {user.role === 'customer' && (
                <button
                  type="button"
                  disabled={busy}
                  style={{ color: '#d97706', fontWeight: 600, textAlign: 'left' }}
                  onClick={handleBecomeTechnician}
                >
                  🔧 Đăng ký làm thợ
                </button>
              )}

              {user.role === 'admin' && (
                <Link to="/admin">Trang quản trị →</Link>
              )}
              <button disabled={busy} onClick={logout}>
                Đăng xuất
              </button>
            </nav>
          </aside>

          <section className="hf-card profile-form">
            <h2>
              {tab === 'profile'
                ? 'Hồ sơ của bạn'
                : tab === 'password'
                ? 'Bảo mật tài khoản'
                : 'Xác minh hồ sơ thợ (KYC)'}
            </h2>
            <p className="hf-muted">
              {tab === 'profile'
                ? 'Cập nhật thông tin liên hệ và địa chỉ thường dùng.'
                : tab === 'password'
                ? 'Sử dụng mật khẩu mạnh để bảo vệ tài khoản.'
                : 'Tải lên CCCD và chứng chỉ nghề để được cấp quyền nhận đơn sửa chữa.'}
            </p>

            {user.role === 'customer' && tab === 'profile' && (
              <div style={{ margin: '16px 0 24px', padding: '16px 18px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#92400e', fontWeight: 700 }}>
                    🔧 Bạn có tay nghề và muốn nhận việc sửa chữa?
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#b45309' }}>
                    Đăng ký nâng cấp tài khoản của bạn thành Đối tác Thợ HomeFix để nhận đơn việc ngay hôm nay.
                  </p>
                </div>
                <button
                  type="button"
                  className="hf-button small"
                  style={{ background: '#d97706', borderColor: 'transparent', whiteSpace: 'nowrap', fontWeight: 700 }}
                  disabled={busy}
                  onClick={handleBecomeTechnician}
                >
                  Đăng ký làm thợ ngay →
                </button>
              </div>
            )}

            {notice && (
              <div
                className={`hf-notice ${notice.type}`}
                role={notice.type === 'error' ? 'alert' : 'status'}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  background: notice.type === 'error' ? '#fef2f2' : '#f0fdf4',
                  color: notice.type === 'error' ? '#991b1b' : '#166534',
                  border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                }}
              >
                {notice.text}
              </div>
            )}

            {/* TAB KYC DÀNH CHO THỢ */}
            {tab === 'kyc' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    background: user?.is_verified ? '#f0fdf4' : '#fffbeb',
                    border: `1px solid ${user?.is_verified ? '#bbf7d0' : '#fde68a'}`,
                  }}
                >
                  <strong>Trạng thái xác minh: </strong>
                  {user?.is_verified ? (
                    <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
                      ✅ Đã xác minh KYC (Đủ điều kiện nhận việc)
                    </span>
                  ) : (
                    <span style={{ color: '#d97706', fontWeight: 'bold' }}>
                      ⏳ Đang chờ Admin xét duyệt hồ sơ
                    </span>
                  )}
                </div>

                {/* Form upload CCCD */}
                <form onSubmit={handleUploadCccd} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    1. Căn cước công dân gắn chip (CCCD)
                  </h3>
                  <p className="hf-muted" style={{ fontSize: '0.82rem', marginBottom: '12px' }}>
                    Chụp rõ nét mặt trước thẻ CCCD của bạn để xác thực danh tính.
                  </p>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                      Số CCCD (12 chữ số)
                    </label>
                    <input
                      className="hf-input"
                      type="text"
                      maxLength={12}
                      placeholder="079xxxxxxxx"
                      value={kycNumber}
                      onChange={(e) => setKycNumber(e.target.value)}
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                      Chọn ảnh mặt trước CCCD
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCccdFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  {user?.cccd_image && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        Ảnh CCCD hiện tại:
                      </span>
                      <img
                        src={user.cccd_image}
                        alt="CCCD đã tải lên"
                        style={{ maxHeight: '120px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  )}

                  <button className="hf-button secondary small" type="submit" disabled={busy || !cccdFile}>
                    {busy ? 'Đang tải lên...' : 'Tải lên CCCD'}
                  </button>
                </form>

                {/* Form upload Chứng chỉ nghề */}
                <form onSubmit={handleUploadCert} style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '8px' }}>
                    2. Chứng chỉ tay nghề / Lý lịch tư pháp
                  </h3>
                  <p className="hf-muted" style={{ fontSize: '0.82rem', marginBottom: '12px' }}>
                    Giấy chứng nhận đào tạo nghề, bằng cấp chuyên môn hoặc giấy xác nhận tư pháp.
                  </p>

                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="file"
                      accept="image/*, application/pdf"
                      onChange={(e) => setCertFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  {user?.criminal_record_url && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                        Tài liệu hiện tại:
                      </span>
                      <a
                        href={user.criminal_record_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.85rem' }}
                      >
                        📄 Xem chứng chỉ đã nộp →
                      </a>
                    </div>
                  )}

                  <button className="hf-button secondary small" type="submit" disabled={busy || !certFile}>
                    {busy ? 'Đang tải lên...' : 'Tải lên chứng chỉ'}
                  </button>
                </form>
              </div>
            ) : (
              /* TAB PROFILE / PASSWORD */
              <form onSubmit={submit} noValidate aria-busy={busy}>
                <fieldset disabled={busy}>
                  {tab === 'profile' ? (
                    <>
                      <FormField
                        label="Họ và tên"
                        name="full_name"
                        required
                        autoComplete="name"
                        maxLength={100}
                        value={values.full_name}
                        onChange={change}
                        error={errors.full_name}
                      />
                      <FormField
                        label="Email"
                        name="email"
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        hint="Email được dùng để đăng nhập và không thể thay đổi tại đây."
                      />
                      <FormField
                        label="Số điện thoại"
                        name="phone"
                        type="tel"
                        required
                        autoComplete="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={values.phone}
                        onChange={change}
                        error={errors.phone}
                      />
                      <FormField
                        label="Địa chỉ"
                        name="address"
                        autoComplete="street-address"
                        maxLength={500}
                        value={values.address}
                        onChange={change}
                        error={errors.address}
                        placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                      />
                    </>
                  ) : (
                    <>
                      <FormField
                        label="Mật khẩu hiện tại"
                        name="current_password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={passwords.current_password}
                        onChange={change}
                        error={errors.current_password}
                      />
                      <FormField
                        label="Mật khẩu mới"
                        name="new_password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={passwords.new_password}
                        onChange={change}
                        error={errors.new_password}
                        hint={passwordHint}
                      />
                      <FormField
                        label="Xác nhận mật khẩu mới"
                        name="confirm_password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={passwords.confirm_password}
                        onChange={change}
                        error={errors.confirm_password}
                      />
                    </>
                  )}
                  <button className="hf-button" type="submit">
                    {busy
                      ? 'Đang lưu…'
                      : tab === 'profile'
                      ? 'Lưu thay đổi'
                      : 'Đổi mật khẩu'}
                  </button>
                </fieldset>
              </form>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
