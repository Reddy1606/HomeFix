import { Link } from 'react-router-dom';
import { SERVICE_CATEGORIES } from '../../data/mockServices';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-gray-100 bg-gray-900 text-gray-300">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
              H
            </span>
            <span className="text-lg font-bold text-white">HomeFix</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">
            Nền tảng gọi thợ sửa chữa tại nhà theo yêu cầu. Thợ đã xác minh CCCD
            và lý lịch tư pháp, giá niêm yết minh bạch, bảo hành rõ ràng.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
            Dịch vụ
          </h3>
          <ul className="space-y-2 text-sm">
            {SERVICE_CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  to={`/services?category=${encodeURIComponent(cat.name)}`}
                  className="text-gray-400 hover:text-white"
                >
                  {cat.icon} {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
            Hỗ trợ khách hàng
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link to="/services" className="hover:text-white">
                Bảng giá dịch vụ
              </Link>
            </li>
            <li>
              <Link to="/booking" className="hover:text-white">
                Hướng dẫn đặt lịch
              </Link>
            </li>
            <li>
              <a href="/#about" className="hover:text-white">
                Chính sách bảo hành
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:text-white">
                Đăng nhập / Đăng ký
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white">
            Liên hệ
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📍 Đại học FPT, TP. Thủ Đức, TP.HCM</li>
            <li>
              📞{' '}
              <a href="tel:19001234" className="hover:text-white">
                1900 1234
              </a>
            </li>
            <li>
              ✉️{' '}
              <a href="mailto:support@homefix.vn" className="hover:text-white">
                support@homefix.vn
              </a>
            </li>
            <li>🕐 Hoạt động 24/7, kể cả ngày lễ</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-5">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-gray-500 sm:px-6 lg:px-8">
          © {CURRENT_YEAR} HomeFix · Đề án Khởi nghiệp đổi mới sáng
          tạo EXE101 - Đại học FPT. Mọi dữ liệu dịch vụ chỉ mang tính minh họa.
        </p>
      </div>
    </footer>
  );
}
