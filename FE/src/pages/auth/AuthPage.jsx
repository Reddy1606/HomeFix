import { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import FormField from '../../components/auth/FormField';
import { forgotPassword, resetPassword } from '../../api/auth';
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
  const isForgotPassword = mode === 'forgot-password';
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
  const [successNotice, setSuccessNotice] = useState('');
  const [busy, setBusy] = useState(false);

  // States dành riêng cho Quên mật khẩu & OTP
  const [forgotStep, setForgotStep] = useState(1); // 1: nhập email, 2: nhập OTP & mật khẩu mới, 3: thành công
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Bộ đếm ngược 60 giây gửi lại mã OTP
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const returnTo =
    safeReturnTo(location.state?.from) ||
    safeReturnTo(new URLSearchParams(location.search).get('redirect'));
  const destination = (account) => {
    if (!account) return '/';
    const role = account.role;

    // 1. Phân loại và kiểm tra returnTo hợp lệ theo từng vai trò
    if (returnTo) {
      // Admin: Chỉ chấp nhận quay lại nếu returnTo thuộc khu vực /admin
      if (role === 'admin' && returnTo.startsWith('/admin')) {
        return returnTo;
      }
      // Thợ (technician): Chỉ chấp nhận quay lại các trang dành cho thợ (/technician hoặc /profile)
      if (role === 'technician' && (returnTo.startsWith('/technician') || returnTo === '/profile')) {
        return returnTo;
      }
      // Khách hàng (customer / user): Tuyệt đối KHÔNG chuyển vào /admin hoặc /technician
      if (
        role === 'customer' &&
        !returnTo.startsWith('/admin') &&
        !returnTo.startsWith('/technician')
      ) {
        return returnTo;
      }
    }

    // 2. Điểm đến mặc định chuẩn xác theo từng role khi đăng nhập:
    if (role === 'admin') return '/admin';
    if (role === 'technician') return '/technician/jobs';
    return '/'; // Khách hàng (user thường) chuyển thẳng về Trang chủ
  };

  const change = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
  };

  // Submit Login hoặc Đăng ký
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

  // Bước 1: Gửi yêu cầu OTP qua Email
  async function handleSendOtp(event) {
    if (event) event.preventDefault();
    if (busy || cooldown > 0) return;

    const emailTarget = forgotEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTarget)) {
      setErrors({ forgotEmail: 'Vui lòng nhập địa chỉ email hợp lệ.' });
      return;
    }

    setBusy(true);
    setMessage('');
    setSuccessNotice('');
    setErrors({});

    try {
      const res = await forgotPassword({ email: emailTarget });
      setSuccessNotice(res.message || 'Mã OTP đã được gửi đến email của bạn.');
      setForgotStep(2);
      setCooldown(60); // Đếm ngược 60s
    } catch (error) {
      setMessage(apiError(error));
      setErrors(fieldErrors(error));
    } finally {
      setBusy(false);
    }
  }

  // Bước 2: Xác thực OTP và Đặt lại mật khẩu mới
  async function handleResetPassword(event) {
    event.preventDefault();
    if (busy) return;

    const nextErrors = {};
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      nextErrors.otp = 'Mã OTP phải gồm đúng 6 chữ số.';
    }

    if (!newPassword) {
      nextErrors.newPassword = 'Vui lòng nhập mật khẩu mới.';
    } else if (!isStrongPassword(newPassword)) {
      nextErrors.newPassword = passwordHint;
    }

    if (confirmNewPassword !== newPassword) {
      nextErrors.confirmNewPassword = 'Mật khẩu xác nhận không trùng khớp.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage('Vui lòng kiểm tra các trường bên dưới.');
      return;
    }

    setBusy(true);
    setMessage('');
    setSuccessNotice('');

    try {
      const res = await resetPassword({
        email: forgotEmail.trim(),
        otp: cleanOtp,
        new_password: newPassword,
      });
      setSuccessNotice(res.message || 'Đặt lại mật khẩu thành công!');
      setForgotStep(3);
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

          {/* ===================== CHẾ ĐỘ QUÊN MẬT KHẨU ===================== */}
          {isForgotPassword ? (
            <div>
              {forgotStep === 1 && (
                <>
                  <h2 id="auth-title">Quên mật khẩu?</h2>
                  <p className="hf-muted">
                    Nhập địa chỉ email đăng ký HomeFix của bạn. Hệ thống sẽ gửi mã OTP 6 chữ số để thiết lập mật khẩu mới.
                  </p>

                  {message && (
                    <div className="hf-notice error" role="alert">
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleSendOtp} noValidate aria-busy={busy}>
                    <fieldset disabled={busy}>
                      <div className="hf-field">
                        <label htmlFor="forgot-email">
                          Email tài khoản <span aria-hidden="true">*</span>
                        </label>
                        <div className="hf-input-wrap">
                          <input
                            id="forgot-email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="ban@example.com"
                            value={forgotEmail}
                            onChange={(e) => {
                              setForgotEmail(e.target.value);
                              setErrors({});
                              setMessage('');
                            }}
                          />
                        </div>
                        {errors.forgotEmail && (
                          <p className="hf-field-error">{errors.forgotEmail}</p>
                        )}
                      </div>

                      <button type="submit" className="hf-button full">
                        {busy ? 'Đang gửi mã…' : 'Gửi mã OTP về email'}
                        <span aria-hidden="true"> →</span>
                      </button>
                    </fieldset>
                  </form>

                  <p className="auth-switch" style={{ marginTop: '24px' }}>
                    Nhớ mật khẩu rồi? <Link to="/login">Đăng nhập</Link>
                  </p>
                </>
              )}

              {forgotStep === 2 && (
                <>
                  <h2 id="auth-title">Nhập mã OTP & Đặt mật khẩu mới</h2>
                  <p className="hf-muted">
                    Mã xác thực đã được gửi tới <strong>{forgotEmail}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác).
                  </p>

                  {successNotice && (
                    <div className="hf-notice success" role="status" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
                      ✉️ {successNotice}
                    </div>
                  )}

                  {message && (
                    <div className="hf-notice error" role="alert">
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} noValidate aria-busy={busy}>
                    <fieldset disabled={busy}>
                      {/* Trường nhập OTP */}
                      <div className="hf-field">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label htmlFor="otp-input">
                            Mã xác thực OTP (6 chữ số) <span aria-hidden="true">*</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSendOtp()}
                            disabled={busy || cooldown > 0}
                            style={{
                              border: 'none',
                              background: 'none',
                              color: cooldown > 0 ? '#94a3b8' : '#2563eb',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                              padding: '0 4px',
                            }}
                          >
                            {cooldown > 0 ? `Gửi lại sau (${cooldown}s)` : 'Gửi lại mã'}
                          </button>
                        </div>
                        <div className="hf-input-wrap">
                          <input
                            id="otp-input"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            required
                            placeholder="VD: 123456"
                            value={otpCode}
                            style={{ letterSpacing: '4px', fontSize: '1.2rem', fontWeight: 700, textAlign: 'center' }}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setOtpCode(val);
                              setErrors((prev) => ({ ...prev, otp: '' }));
                              setMessage('');
                            }}
                          />
                        </div>
                        {errors.otp && (
                          <p className="hf-field-error">{errors.otp}</p>
                        )}
                      </div>

                      {/* Mật khẩu mới */}
                      <FormField
                        label="Mật khẩu mới"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setErrors((prev) => ({ ...prev, newPassword: '' }));
                          setMessage('');
                        }}
                        error={errors.newPassword}
                        hint={passwordHint}
                      />

                      {/* Xác nhận mật khẩu mới */}
                      <FormField
                        label="Xác nhận mật khẩu mới"
                        name="confirmNewPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          setErrors((prev) => ({ ...prev, confirmNewPassword: '' }));
                          setMessage('');
                        }}
                        error={errors.confirmNewPassword}
                      />

                      <button type="submit" className="hf-button full">
                        {busy ? 'Đang cập nhật mật khẩu…' : 'Xác nhận & Đổi mật khẩu'}
                        <span aria-hidden="true"> →</span>
                      </button>
                    </fieldset>
                  </form>

                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(1);
                        setMessage('');
                        setSuccessNotice('');
                      }}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#64748b',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      ← Nhập lại email khác
                    </button>
                    <Link to="/login" style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                      Về trang đăng nhập
                    </Link>
                  </div>
                </>
              )}

              {forgotStep === 3 && (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#16a34a',
                      fontSize: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    ✓
                  </div>
                  <h2 id="auth-title">Đổi mật khẩu thành công!</h2>
                  <p className="hf-muted" style={{ marginBottom: '24px' }}>
                    Mật khẩu tài khoản của bạn đã được cập nhật thành công. Bây giờ bạn có thể đăng nhập ngay với mật khẩu mới.
                  </p>
                  <Link
                    to="/login"
                    className="hf-button full"
                    style={{ textDecoration: 'none' }}
                  >
                    Đăng nhập ngay →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* ===================== CHẾ ĐỘ ĐĂNG NHẬP HOẶC ĐĂNG KÝ ===================== */
            <div>
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

                  {/* Nút Quên mật khẩu bên dưới trường mật khẩu của Login */}
                  {!registering && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-6px', marginBottom: '14px' }}>
                      <Link
                        to="/forgot-password"
                        style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                  )}

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
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
