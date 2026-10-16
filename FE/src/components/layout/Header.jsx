import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/auth';

const NAV_LINKS = [
  { to: '/', label: 'Trang chủ' },
  { to: '/services', label: 'Dịch vụ' },
  { to: '/booking', label: 'Đặt lịch' },
  { to: '/my-bookings', label: 'Lịch sử đặt lịch' },
  { to: '/#contact', label: 'Liên hệ' },
];

function NavItem({ to, label, onClick }) {
  // Các mục trỏ tới anchor (ví dụ /#about) không dùng NavLink active state
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
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-3 py-2 text-sm font-semibold md:px-0 ${
          isActive ? 'text-brand-600' : 'text-gray-600 hover:text-brand-600'
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

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user?.role === 'admin' && (
            <Link to="/admin" className="text-sm font-semibold text-brand-600">
              Quản trị
            </Link>
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
              className="text-sm font-semibold text-gray-600"
              onClick={logout}
            >
              Đăng xuất
            </button>
          )}
          <Link
            to="/booking"
            className="rounded-full bg-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-accent-500/30 transition hover:scale-105 hover:bg-accent-600"
          >
            Gọi thợ ngay
          </Link>
        </div>

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

      {isMenuOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <NavItem key={link.to} {...link} onClick={closeMenu} />
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={closeMenu}
                  className="px-3 py-2 text-sm font-semibold text-brand-600"
                >
                  Quản trị
                </Link>
              )}
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
              <Link
                to="/booking"
                onClick={closeMenu}
                className="rounded-lg bg-accent-500 px-3 py-2 text-center text-sm font-semibold text-white"
              >
                Gọi thợ ngay
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
