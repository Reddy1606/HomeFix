import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import { changePassword, updateProfile } from '../../api/auth';
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
  const [tab, setTab] = useState('profile');
  const [values, setValues] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    address: user.address || '',
  });
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
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

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const nextErrors = tab === 'profile' ? validateProfile(values) : {};
    if (tab === 'password') {
      if (!passwords.current_password)
        nextErrors.current_password = 'Nhập mật khẩu hiện tại.';
      if (!isStrongPassword(passwords.new_password))
        nextErrors.new_password = passwordHint;
      if (passwords.new_password === passwords.current_password)
        nextErrors.new_password = 'Mật khẩu mới cần khác mật khẩu hiện tại.';
      if (passwords.confirm_password !== passwords.new_password)
        nextErrors.confirm_password = 'Mật khẩu xác nhận chưa trùng khớp.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setBusy(true);
    setNotice(null);
    try {
      if (tab === 'profile') {
        const updated = await updateProfile(
          Object.fromEntries(
            Object.entries(values).map(([key, value]) => [key, value.trim()])
          )
        );
        setUser(updated);
        setNotice({ type: 'success', text: 'Đã lưu thông tin cá nhân.' });
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
        setNotice({ type: 'success', text: 'Đổi mật khẩu thành công.' });
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
            <div className="profile-avatar" aria-hidden="true">
              {user.full_name?.trim().charAt(0).toUpperCase() || 'H'}
            </div>
            <h2>{user.full_name}</h2>
            <p className="hf-muted break-word">{user.email}</p>
            <span className="hf-badge">{roles[user.role] || 'Thành viên'}</span>
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
              {user.role === 'admin' && (
                <Link to="/admin">Trang quản trị →</Link>
              )}
              <button disabled={busy} onClick={logout}>
                Đăng xuất
              </button>
            </nav>
          </aside>
          <section className="hf-card profile-form">
            <h2>{tab === 'profile' ? 'Hồ sơ của bạn' : 'Bảo mật tài khoản'}</h2>
            <p className="hf-muted">
              {tab === 'profile'
                ? 'Cập nhật thông tin liên hệ và địa chỉ thường dùng.'
                : 'Sử dụng mật khẩu mạnh để bảo vệ tài khoản.'}
            </p>
            {notice && (
              <div
                className={`hf-notice ${notice.type}`}
                role={notice.type === 'error' ? 'alert' : 'status'}
              >
                {notice.text}
              </div>
            )}
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
                      value={user.email}
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
          </section>
        </div>
      </div>
    </main>
  );
}
