import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import FormField from '../../components/auth/FormField';
import {
  apiError,
  fieldErrors,
  isStrongPassword,
  passwordHint,
  safeReturnTo,
  validateProfile,
} from '../../utils/validation';

export default function AuthPage({ mode = 'login' }) {
  const location = useLocation();
  const queryRole = new URLSearchParams(location.search).get('role');
  const registering = mode === 'register' || mode === 'register-technician';
  const { user, loading, login, register } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(
    mode === 'register-technician' || queryRole === 'technician' ? 'technician' : 'customer'
  );
  const [values, setValues] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const returnTo =
    safeReturnTo(location.state?.from) ||
    safeReturnTo(new URLSearchParams(location.search).get('redirect'));
  const destination = (account) =>
    returnTo && (!returnTo.startsWith('/admin') || account.role === 'admin')
      ? returnTo
      : account.role === 'admin'
        ? '/admin'
        : '/profile';

  const change = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
  };
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const nextErrors = registering ? validateProfile(values) : {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
      nextErrors.email = 'Nhập địa chỉ email hợp lệ.';
    if (!values.password) nextErrors.password = 'Vui lòng nhập mật khẩu.';
    else if (registering && !isStrongPassword(values.password))
      nextErrors.password = passwordHint;
    if (registering && values.confirm_password !== values.password)
      nextErrors.confirm_password = 'Mật khẩu xác nhận chưa trùng khớp.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage('Vui lòng kiểm tra các trường bên dưới.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const payload = { email: values.email.trim(), password: values.password };
      if (registering)
        Object.assign(payload, {
          full_name: values.full_name.trim(),
          phone: values.phone.trim(),
          role: selectedRole,
        });
      const account = await (registering ? register(payload) : login(payload));
      navigate(destination(account), { replace: true });
    } catch (error) {
      setMessage(apiError(error));
      setErrors(fieldErrors(error));
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="account-loading" role="status">
        Đang kiểm tra tài khoản…
      </div>
    );
  if (user) return <Navigate to={destination(user)} replace />;

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <aside className="auth-story">
          <span className="hf-eyebrow">HOMEFIX · AN TÂM MỖI NGÀY</span>
          <h1>
            Nhà cần sửa.
            <br />
            Đã có HomeFix.
          </h1>
          <p>
            Kết nối với thợ sửa chữa, theo dõi lịch hẹn và giữ thông tin bảo
            hành trong một tài khoản.
          </p>
          <div className="home-illustration" aria-hidden="true">
            <svg viewBox="0 0 320 230" fill="none">
              <circle
                cx="160"
                cy="110"
                r="100"
                fill="#ffffff"
                fillOpacity=".07"
              />
              <path
                d="m65 112 95-77 95 77"
                stroke="#93c5fd"
                strokeWidth="13"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M90 108v91h140v-91" fill="#dbeafe" />
              <path d="M139 199v-62h42v62" fill="#2563eb" />
              <rect
                x="105"
                y="123"
                width="24"
                height="28"
                rx="4"
                fill="#60a5fa"
              />
              <rect
                x="191"
                y="123"
                width="24"
                height="28"
                rx="4"
                fill="#60a5fa"
              />
              <circle cx="242" cy="183" r="34" fill="#f97316" />
              <path
                d="m228 183 10 10 18-20"
                stroke="white"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="auth-promises">
            <span>✓ Giá cả minh bạch</span>
            <span>✓ Thợ được xác minh</span>
            <span>✓ Đồng hành sau sửa chữa</span>
          </div>
        </aside>
        <section className="auth-form-panel" aria-labelledby="auth-title">
          <Link to="/" className="hf-back">
            ← Về trang chủ
          </Link>
          <span className="hf-eyebrow">TÀI KHOẢN HOMEFIX</span>
          <h2 id="auth-title">
            {!registering
              ? 'Chào mừng bạn trở lại'
              : selectedRole === 'technician'
                ? 'Đăng ký làm thợ HomeFix'
                : 'Tạo tài khoản mới'}
          </h2>
          <p className="hf-muted">
            {!registering
              ? 'Đăng nhập để quản lý lịch hẹn và thông tin cá nhân.'
              : selectedRole === 'technician'
                ? 'Gia nhập đội ngũ thợ lành nghề, kết nối khách hàng và tăng thu nhập ổn định.'
                : 'Sẵn sàng cho một ngôi nhà được chăm sóc tốt hơn.'}
          </p>
          {registering && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Bạn đăng ký với tư cách:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `2px solid ${selectedRole === 'customer' ? '#2563eb' : '#e2e8f0'}`,
                    background: selectedRole === 'customer' ? '#eff6ff' : '#ffffff',
                    color: selectedRole === 'customer' ? '#1d4ed8' : '#64748b',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setSelectedRole('customer')}
                >
                  🛍️ Khách hàng
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 400, marginTop: '2px', color: '#64748b' }}>
                    Đặt lịch sửa nhà
                  </span>
                </button>

                <button
                  type="button"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: `2px solid ${selectedRole === 'technician' ? '#d97706' : '#e2e8f0'}`,
                    background: selectedRole === 'technician' ? '#fffbeb' : '#ffffff',
                    color: selectedRole === 'technician' ? '#b45309' : '#64748b',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onClick={() => setSelectedRole('technician')}
                >
                  🔧 Thợ sửa chữa
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 400, marginTop: '2px', color: '#64748b' }}>
                    Nhận việc sửa chữa
                  </span>
                </button>
              </div>

              {selectedRole === 'technician' && (
                <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '0.8rem', color: '#92400e' }}>
                  ℹ️ <strong>Quy trình đối tác thợ:</strong> Sau khi tạo tài khoản, bạn sẽ bổ sung ảnh CCCD và chứng chỉ tại trang cá nhân để Admin kích hoạt quyền nhận việc.
                </div>
              )}
            </div>
          )}
          {message && (
            <div className="hf-notice error" role="alert">
              {message}
            </div>
          )}
          <form onSubmit={submit} noValidate aria-busy={busy}>
            <fieldset disabled={busy}>
              {registering && (
                <FormField
                  label="Họ và tên"
                  name="full_name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={values.full_name}
                  onChange={change}
                  error={errors.full_name}
                  placeholder="Nguyễn Văn An"
                />
              )}
              <FormField
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={values.email}
                onChange={change}
                error={errors.email}
                placeholder="ban@example.com"
              />
              {registering && (
                <FormField
                  label="Số điện thoại"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  required
                  maxLength={10}
                  value={values.phone}
                  onChange={change}
                  error={errors.phone}
                  placeholder="0901234567"
                />
              )}
              <FormField
                label="Mật khẩu"
                name="password"
                type="password"
                autoComplete={registering ? 'new-password' : 'current-password'}
                required
                value={values.password}
                onChange={change}
                error={errors.password}
                hint={registering ? passwordHint : undefined}
              />
              {registering && (
                <FormField
                  label="Xác nhận mật khẩu"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={values.confirm_password}
                  onChange={change}
                  error={errors.confirm_password}
                />
              )}
              <button type="submit" className="hf-button full">
                {busy
                  ? 'Đang xử lý…'
                  : registering
                    ? (selectedRole === 'technician' ? 'Đăng ký làm thợ ngay' : 'Tạo tài khoản')
                    : 'Đăng nhập'}
                <span aria-hidden="true"> →</span>
              </button>
            </fieldset>
          </form>
          <p className="auth-switch">
            {registering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <Link
              to={registering ? '/login' : '/register'}
              state={location.state}
            >
              {registering ? 'Đăng nhập' : 'Đăng ký ngay'}
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
