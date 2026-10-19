import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/auth';

export default function ProtectedRoute({ adminOnly = false, allowedRoles = null }) {
  const { user, loading, sessionError, restoreSession, logout } = useAuth();
  const location = useLocation();
  if (loading)
    return (
      <div className="account-loading" role="status">
        Đang kiểm tra tài khoản…
      </div>
    );
  if (sessionError)
    return (
      <section className="account-state">
        <h1>Chưa thể kiểm tra phiên đăng nhập</h1>
        <p role="alert">{sessionError}</p>
        <button className="hf-button" onClick={restoreSession}>
          Thử lại
        </button>
        <button className="hf-button secondary" onClick={logout}>
          Đăng nhập lại
        </button>
      </section>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && user.role !== 'admin')
    return (
      <section className="account-state">
        <span className="hf-eyebrow">403 · Quyền truy cập</span>
        <h1>Bạn không có quyền truy cập</h1>
        <p>Trang này chỉ dành cho quản trị viên HomeFix.</p>
        <Link className="hf-button" to="/">
          Về trang chủ
        </Link>
      </section>
    );

  // Kiểm tra vai trò được phép truy cập
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'technician') return <Navigate to="/technician/jobs" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

