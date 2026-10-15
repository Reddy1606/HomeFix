import { Link } from 'react-router-dom';

/**
 * Trang tạm cho các route thuộc phạm vi Frontend 2 / Frontend 3
 * (Đặt lịch, Đăng nhập, Đăng ký...) để tránh lỗi "trang trắng" khi demo.
 * Các bạn phụ trách có thể thay thế bằng component thật của mình.
 */
export default function PlaceholderPage({ title, description }) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
      <span className="text-5xl">🚧</span>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-gray-500">{description}</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
