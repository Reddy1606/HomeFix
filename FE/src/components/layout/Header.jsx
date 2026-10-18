import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/auth';

function getNavLinks(user) {
  // 1. Quản trị viên
  if (user?.role === 'admin') {
    return [
      { to: '/', label: 'Trang chủ' },
      { to: '/admin', label: 'Bảng quản trị' },
      { to: '/admin/bookings', label: 'Quản lý đơn' },
      { to: '/admin/users', label: 'Quản lý tài khoản' },
      { to: '/admin/services', label: 'Dịch vụ' },
    ];
  }

  // 2. Thợ sửa chữa
  if (user?.role === 'technician') {
    return [
      { to: '/', label: 'Trang chủ' },
      { to: '/technician/jobs', label: 'Cổng nhận việc ⚡' },
      { to: '/services', label: 'Bảng giá dịch vụ' },
      { to: '/profile', label: 'Hồ sơ thợ (KYC)' },
      { to: '/#contact', label: 'Hỗ trợ kỹ thuật' },
    ];
  }

  // 3. Khách hàng đã đăng nhập
  if (user?.role === 'customer') {
    return [
      { to: '/', label: 'Trang chủ' },
      { to: '/services', label: 'Dịch vụ' },
      { to: '/booking', label: 'Đặt lịch' },
      { to: '/my-bookings', label: 'Lịch sử đặt lịch' },
      { to: '/register?role=technician', label: 'Đăng ký làm thợ' },
      { to: '/#contact', label: 'Liên hệ' },
    ];
  }

  // 4. Khách chưa đăng nhập (Guest)
  return [
    { to: '/', label: 'Trang chủ' },
    { to: '/services', label: 'Dịch vụ' },
    { to: '/booking', label: 'Đặt lịch' },
    { to: '/register?role=technician', label: 'Đăng ký làm thợ' },
    { to: '/#contact', label: 'Liên hệ' },
  ];
}

function NavItem({ to, label, onClick }) {
  if (to.includes('#')) {
    return (
      <a
        href={to}
        onClick={onClick}
        className="block px-3 py-2 text-sm font-semibold text-gray-600 hover:text-brand-600 md:px-0"
      >
        {label}
      </a>
    );
  }

  return (
    <NavLink
      to={to}
      end={to === '/' || to === '/admin'}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-3 py-2 text-sm font-semibold md:px-0 transition ${
          isActive ? 'text-brand-600 font-bold' : 'text-gray-600 hover:text-brand-600'
        }`
      }
    >
      {label}
    </NavLink>
  );
}

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const closeMenu = () => setIsMenuOpen(false);

  const navLinks = getNavLinks(user);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-md shadow-brand-500/30">
            H
          </span>
          <span className="text-lg font-extrabold tracking-tight text-gray-900">
            HomeFix
          </span>
        </Link>

        {/* Menu chính hiển thị phù hợp theo từng vai trò */}
        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>

        {/* Khối hành động góc phải */}
        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <div className="flex items-center gap-1.5">
              {user.role === 'admin' && (
                <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                  Admin
                </span>
              )}
              {user.role === 'technician' && (
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold ${
                    user.is_verified
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {user.is_verified ? 'Thợ' : 'Chờ KYC'}
                </span>
              )}
            </div>
          )}

          <Link
            to={user ? '/profile' : '/login'}
            className="text-sm font-semibold text-gray-700 hover:text-brand-600"
          >
            {loading ? 'Đang tải…' : user ? 'Tài khoản' : 'Đăng nhập'}
          </Link>

          {user && (
            <button
              type="button"
              className="text-sm font-semibold text-gray-500 hover:text-rose-600 transition"
              onClick={logout}
            >
              Đăng xuất
            </button>
          )}

          {/* Nút hành động nổi bật (CTA) theo từng role */}
          {user?.role === 'admin' ? (
            <Link
              to="/admin"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md shadow-slate-900/20 transition hover:scale-105 hover:bg-slate-800"
            >
              👑 Quản trị
            </Link>
          ) : user?.role === 'technician' ? (
            <Link
              to={user.is_verified ? '/technician/jobs' : '/profile'}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-500/30 transition hover:scale-105 hover:bg-brand-700"
            >
              {user.is_verified ? '⚡ Nhận việc ngay' : '🔧 Xác minh KYC'}
            </Link>
          ) : (
            <Link
              to="/booking"
              className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-accent-500/30 transition hover:scale-105 hover:bg-accent-600"
            >
              Gọi thợ ngay
            </Link>
          )}
        </div>

        {/* Nút bật tắt menu Mobile */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 md:hidden"
          aria-label="Mở menu điều hướng"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span className="sr-only">Menu</span>
          {isMenuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Menu Mobile theo từng vai trò */}
      {isMenuOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <NavItem key={link.to} {...link} onClick={closeMenu} />
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
              <Link
                to={user ? '/profile' : '/login'}
                onClick={closeMenu}
                className="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700"
              >
                {loading ? 'Đang tải…' : user ? 'Tài khoản' : 'Đăng nhập'}
              </Link>
              {user && (
                <button
                  type="button"
                  className="px-3 py-2 text-sm font-semibold text-gray-600"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                >
                  Đăng xuất
                </button>
              )}
              {user?.role === 'admin' ? (
                <Link
                  to="/admin"
                  onClick={closeMenu}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  👑 Quản trị
                </Link>
              ) : user?.role === 'technician' ? (
                <Link
                  to={user.is_verified ? '/technician/jobs' : '/profile'}
                  onClick={closeMenu}
                  className="rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  {user.is_verified ? '⚡ Nhận việc ngay' : '🔧 Xác minh KYC'}
                </Link>
              ) : (
                <Link
                  to="/booking"
                  onClick={closeMenu}
                  className="rounded-lg bg-accent-500 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  Gọi thợ ngay
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
