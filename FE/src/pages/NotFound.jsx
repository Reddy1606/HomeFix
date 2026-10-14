import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-brand-600">404</h1>
      <p className="mt-3 text-lg text-gray-600">
        Không tìm thấy trang bạn yêu cầu.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
