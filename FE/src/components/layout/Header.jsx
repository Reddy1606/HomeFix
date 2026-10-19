import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth';

/**
 * Danh sách menu chính được tinh gọn tối đa theo từng vai trò,
 * tránh dồn ứ quá nhiều mục trên thanh điều hướng trên cùng.
 */
function getNavLinks(user) {
  // 1. Quản trị viên
  if (user?.role === 'admin') {
    return [
      { to: '/', label: 'Trang chủ' },
      { to: '/admin', label: 'Bảng quản trị' },
      { to: '/admin/bookings', label: 'Quản lý đơn' },
      { to: '/admin/packages', label: 'Gói dịch vụ (MRR)' },
    ];
  }

  // 2. Thợ sửa chữa: Chỉ giữ các tính năng cốt lõi nhất của thợ
  if (user?.role === 'technician') {
    return [
      { to: '/', label: 'Trang chủ' },
      { to: '/technician/jobs', label: 'Cổng nhận việc ⚡' },
      { to: '/services', label: 'Bảng giá dịch vụ' },
    ];
  }

  // 3. Khách hàng đã đăng nhập
  if (user?.role === 'customer') {
    return [
      { to: '/', label: 'Trang chủ' },
      { to: '/services', label: 'Dịch vụ' },
      { to: '/packages', label: 'Gói dịch vụ ⚡' },
      { to: '/booking', label: 'Đặt lịch' },
      { to: '/my-bookings', label: 'Lịch sử đặt lịch' },
    ];
  }

  // 4. Khách chưa đăng nhập (Guest)
  return [
    { to: '/', label: 'Trang chủ' },
    { to: '/services', label: 'Dịch vụ' },
    { to: '/packages', label: 'Gói dịch vụ ⚡' },
    { to: '/booking', label: 'Đặt lịch' },
    { to: '/register?role=technician', label: 'Đăng ký làm thợ' },
  ];
}

function NavItem({ to, label, onClick }) {
  if (to.includes('#')) {
    return (
      <a
        href={to}
        onClick={onClick}
        className="block px-3 py-2 text-sm font-semibold text-gray-600 hover:text-brand-600 md:px-0 transition"
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const closeMenu = () => setIsMenuOpen(false);

  // Xử lý mở/đóng dropdown mượt mà khi di chuột (hover) và click
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 180);
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const navLinks = getNavLinks(user);

  // Lấy chữ cái đầu làm avatar
  const firstLetter = (user?.full_name || user?.name || user?.email || 'U')[0].toUpperCase();

  const handleLogout = () => {
    setIsDropdownOpen(false);
    closeMenu();
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2" onClick={closeMenu}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-md shadow-brand-500/30">
            H
          </span>
          <span className="text-lg font-extrabold tracking-tight text-gray-900">
            HomeFix
          </span>
        </Link>

        {/* MENU CHÍNH TINH GỌN (ẨN TRÊN MOBILE) */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavItem key={link.to} {...link} />
          ))}
        </nav>

        {/* KHỐI TÀI KHOẢN & HÀNH ĐỘNG GÓC PHẢI */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            /* DROPDOWN TÀI KHOẢN KHI DI CHUỘT / CLICK */
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-3 transition duration-150 ${
                  isDropdownOpen
                    ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-500/20'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                {/* Avatar */}
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className={`h-8 w-8 rounded-full object-cover ring-2 ${
                      user.is_vip ? 'ring-amber-400 shadow-sm' : 'ring-gray-200'
                    }`}
                  />
                ) : (
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black shadow-xs ${
                      user.role === 'admin'
                        ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white'
                        : user.role === 'technician'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                        : user.is_vip
                        ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 text-amber-950 ring-2 ring-amber-300'
                        : 'bg-gradient-to-br from-brand-500 to-blue-600 text-white'
                    }`}
                  >
                    {user.is_vip && user.role === 'customer' ? '👑' : firstLetter}
                  </div>
                )}

                {/* Tên & Role */}
                <div className="text-left">
                  <div className="max-w-[120px] truncate text-xs font-bold text-gray-800">
                    {user.full_name || 'Tài khoản'}
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-extrabold ${
                        user.role === 'admin'
                          ? 'bg-rose-100 text-rose-700'
                          : user.role === 'technician'
                          ? user.is_verified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                          : user.is_vip
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-xs'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {user.role === 'admin'
                        ? 'Admin'
                        : user.role === 'technician'
                        ? user.is_verified
                          ? 'Thợ xác minh'
                          : 'Thợ (Chờ KYC)'
                        : user.is_vip
                        ? '👑 VIP Member'
                        : 'Khách hàng'}
                    </span>
                  </div>
                </div>

                {/* Mũi tên chỉ thị */}
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180 text-brand-600' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* MENU DROPDOWN XỔ XUỐNG */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-2xl border border-gray-100 bg-white p-2.5 shadow-2xl ring-1 ring-black/5 animate-fade-in z-50">
                  {/* Header của Popup: Chi tiết tài khoản */}
                  <div className="rounded-xl bg-gray-50/80 p-3 mb-2 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black text-white ${
                          user.role === 'admin'
                            ? 'bg-gradient-to-br from-rose-500 to-pink-600'
                            : user.role === 'technician'
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                            : 'bg-gradient-to-br from-brand-500 to-blue-600'
                        }`}
                      >
                        {firstLetter}
                      </div>
                      <div className="overflow-hidden">
                        <div className="truncate text-sm font-extrabold text-gray-900">
                          {user.full_name}
                        </div>
                        <div className="truncate text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>

                    {/* Trạng thái xác thực */}
                    {user.role === 'technician' && (
                      <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                        <span className="text-gray-500">Hồ sơ thợ:</span>
                        {user.is_verified ? (
                          <span className="font-bold text-emerald-600 flex items-center gap-1">
                            ✓ Đã duyệt KYC
                          </span>
                        ) : (
                          <Link
                            to="/profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="font-bold text-amber-700 hover:underline flex items-center gap-1"
                          >
                            ⚠️ Cần bổ sung CCCD →
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Trạng thái VIP cho Khách hàng */}
                    {user.role === 'customer' && user.is_vip && (
                      <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-xs">
                        <span className="font-extrabold text-amber-900 flex items-center gap-1">
                          👑 {user.subscription?.package_name || 'Hội viên VIP'}
                        </span>
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-black text-amber-800">
                          {user.subscription?.remaining_quota ?? 0} lượt bảo dưỡng
                        </span>
                      </div>
                    )}
                  </div>

                  {/* DANH SÁCH MENU THEO ROLE */}
                  <div className="space-y-0.5 text-xs font-semibold text-gray-700">
                    <Link
                      to="/profile"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-gray-100 transition"
                    >
                      <span className="text-sm">👤</span>
                      <span>Thông tin tài khoản & Cài đặt</span>
                    </Link>

                    {/* Dành riêng cho Thợ */}
                    {user.role === 'technician' && (
                      <>
                        <Link
                          to="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-gray-100 transition"
                        >
                          <span className="text-sm">🪪</span>
                          <span>Hồ sơ thợ (Xác minh KYC CCCD)</span>
                        </Link>
                        <Link
                          to="/technician/jobs"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-amber-50 text-amber-900 transition"
                        >
                          <span className="text-sm">⚡</span>
                          <span>Cổng nhận việc & Theo dõi đơn</span>
                        </Link>
                        <Link
                          to="/packages"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-gray-100 transition"
                        >
                          <span className="text-sm">👑</span>
                          <span>Chính sách Gói VIP Khách hàng</span>
                        </Link>
                        <a
                          href="/#contact"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-gray-100 transition"
                        >
                          <span className="text-sm">🎧</span>
                          <span>Hỗ trợ kỹ thuật 24/7</span>
                        </a>
                      </>
                    )}

                    {/* Dành riêng cho Khách hàng */}
                    {user.role === 'customer' && (
                      <>
                        <Link
                          to="/my-bookings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-gray-100 transition"
                        >
                          <span className="text-sm">📋</span>
                          <span>Lịch sử đặt lịch của tôi</span>
                        </Link>
                        <Link
                          to="/packages"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-amber-50 text-amber-900 transition"
                        >
                          <span className="text-sm">👑</span>
                          <span>Gói dịch vụ HomeCare VIP</span>
                        </Link>
                        <Link
                          to="/register?role=technician"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-gray-100 transition"
                        >
                          <span className="text-sm">🧑‍🔧</span>
                          <span>Đăng ký làm đối tác Thợ</span>
                        </Link>
                      </>
                    )}

                    {/* Dành riêng cho Admin */}
                    {user.role === 'admin' && (
                      <>
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-gray-100 transition"
                        >
                          <span className="text-sm">📊</span>
                          <span>Bảng điều khiển quản trị</span>
                        </Link>
                        <Link
                          to="/admin/bookings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-gray-100 transition"
                        >
                          <span className="text-sm">📋</span>
                          <span>Quản lý đơn hàng</span>
                        </Link>
                        <Link
                          to="/admin/packages"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-gray-100 transition"
                        >
                          <span className="text-sm">👑</span>
                          <span>Quản lý gói dịch vụ (MRR)</span>
                        </Link>
                      </>
                    )}
                  </div>

                  {/* PHẦN ĐĂNG XUẤT */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                    >
                      <span className="text-sm">🚪</span>
                      <span>Đăng xuất tài khoản</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* KHI CHƯA ĐĂNG NHẬP */
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold text-gray-700 hover:text-brand-600 transition"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:border-brand-600 hover:text-brand-600 transition"
              >
                Đăng ký
              </Link>
            </div>
          )}

          {/* NÚT HÀNH ĐỘNG NỔI BẬT (CTA) - Chỉ hiển thị cho khách chưa đăng nhập hoặc khách hàng đặt lịch */}
          {!user ? (
            <Link
              to="/booking"
              className="rounded-full bg-accent-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-accent-500/30 transition hover:scale-105 hover:bg-accent-600"
            >
              Gọi thợ ngay
            </Link>
          ) : user.role === 'customer' ? (
            <Link
              to="/booking"
              className="rounded-full bg-accent-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-accent-500/30 transition hover:scale-105 hover:bg-accent-600"
            >
              Đặt lịch ngay
            </Link>
          ) : null}
        </div>

        {/* NÚT BẬT TẮT MENU MOBILE */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 md:hidden"
          aria-label="Mở menu điều hướng"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span className="sr-only">Menu</span>
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* MENU MOBILE GỌN GÀNG */}
      {isMenuOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden animate-fade-in">
          {/* Thông tin user trên mobile */}
          {user && (
            <div className="border-b border-gray-100 bg-gray-50/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {firstLetter}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{user.full_name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
            </div>
          )}

          <nav className="flex flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => (
              <NavItem key={link.to} {...link} onClick={closeMenu} />
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-semibold text-gray-700"
                  >
                    👤 Tài khoản & Cài đặt
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg bg-rose-50 px-3 py-2 text-center text-sm font-bold text-rose-600"
                  >
                    🚪 Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={closeMenu}
                    className="flex-1 rounded-lg border border-gray-200 py-2 text-center text-sm font-semibold text-gray-700"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMenu}
                    className="flex-1 rounded-lg bg-brand-600 py-2 text-center text-sm font-semibold text-white"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
