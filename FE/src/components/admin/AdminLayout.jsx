import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth';

const links = [
  { to: '/admin', label: 'Tổng quan', icon: '◫' },
  { to: '/admin/bookings', label: 'Quản lý đơn hàng', icon: '▤' },
  { to: '/admin/packages', label: 'Gói dịch vụ (MRR)', icon: '👑' },
  { to: '/admin/services', label: 'Quản lý dịch vụ', icon: '◇' },
  { to: '/admin/users', label: 'Quản lý tài khoản', icon: '👤' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const current = links.find((item) => item.to === location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <span>H</span>HomeFix<span className="admin-tag">ADMIN</span>
        </Link>
        <p className="admin-nav-label">KHÔNG GIAN QUẢN TRỊ</p>
        <nav aria-label="Quản trị">
          {links.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin'}>
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <p>
            Chăm sóc từng ngôi nhà.
            <br />
            Bắt đầu từ mỗi đơn hàng.
          </p>
          <Link to="/">← Về website</Link>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-header">
          <div>
            <span className="hf-muted">Quản trị / </span>
            <strong>{current?.label || 'HomeFix'}</strong>
          </div>
          <div className="admin-user">
            <Link to="/profile" className="admin-user-name">
              {user.full_name}
            </Link>
            <button className="hf-button secondary small" onClick={handleLogout}>
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
        <footer className="admin-footer">
          HomeFix · An tâm về thợ · Minh bạch về giá
        </footer>
      </div>
    </div>
  );
}
