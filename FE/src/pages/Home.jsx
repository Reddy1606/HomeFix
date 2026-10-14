import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../components/common/SectionHeading';
import ServiceCard from '../components/common/ServiceCard';
import { ServiceGridSkeleton } from '../components/common/ServiceCardSkeleton';
import { fetchServices } from '../api/services';
import { SERVICE_CATEGORIES } from '../data/mockServices';

const TRUST_BADGES = [
  { icon: '🪪', label: 'Thợ xác minh CCCD & lý lịch tư pháp' },
  { icon: '💰', label: 'Giá niêm yết, không phát sinh' },
  { icon: '🛡️', label: 'Bảo hành 7 - 30 ngày' },
  { icon: '⏱️', label: 'Có mặt trong 30 phút' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Chọn dịch vụ',
    description: 'Chọn loại sự cố hoặc dịch vụ cần sửa chữa trong bảng giá niêm yết.',
  },
  {
    step: '02',
    title: 'Đặt lịch nhanh',
    description: 'Đặt thợ tức thì hoặc hẹn giờ phù hợp, chỉ mất chưa đến 1 phút.',
  },
  {
    step: '03',
    title: 'Thợ đến tận nơi',
    description: 'Thợ đã xác minh danh tính đến đúng giờ, khảo sát và báo giá rõ ràng.',
  },
  {
    step: '04',
    title: 'Thanh toán & bảo hành',
    description: 'Thanh toán minh bạch sau khi hoàn thành, được bảo hành 7 - 30 ngày.',
  },
];

const WHY_CHOOSE_US = [
  {
    icon: '✅',
    title: 'An tâm về thợ',
    description:
      '100% thợ sửa chữa được xác minh CCCD gắn chip và lý lịch tư pháp trước khi nhận việc.',
  },
  {
    icon: '🧾',
    title: 'Minh bạch về giá',
    description:
      'Bảng giá niêm yết công khai cho từng đầu việc, không lo bị "chặt chém" hay phát sinh chi phí.',
  },
  {
    icon: '📲',
    title: 'Tiện lợi mọi lúc',
    description:
      'Đặt thợ chỉ với vài thao tác, hỗ trợ 24/7 kể cả cuối tuần và ngày lễ.',
  },
  {
    icon: '🔄',
    title: 'Bảo hành rõ ràng',
    description:
      'Mỗi dịch vụ đều có thời hạn bảo hành cụ thể, hỗ trợ sửa lại miễn phí nếu còn lỗi.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Chị Lan Anh',
    role: 'Khách hàng tại Quận 7, TP.HCM',
    content:
      '"Đặt thợ sửa máy lạnh buổi sáng thì trưa thợ đã tới, báo giá rõ ràng trước khi làm nên rất yên tâm."',
  },
  {
    name: 'Anh Minh Khoa',
    role: 'Khách hàng tại TP. Thủ Đức',
    content:
      '"Thích nhất là có bảo hành sau sửa chữa, lần trước quạt kêu lại thợ tới sửa miễn phí ngay."',
  },
  {
    name: 'Cô Thu Hương',
    role: 'Khách hàng tại Quận Bình Thạnh',
    content:
      '"Giá niêm yết rõ ràng ngay trên app, không sợ bị báo giá trên trời như gọi thợ ngoài."',
  },
];

export default function Home() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchServices()
      .then((data) => {
        if (isMounted) setServices(data.slice(0, 6));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium">
              🏠 Nền tảng gọi thợ sửa chữa tại nhà #1
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              An tâm về thợ - Minh bạch về giá - Tiện lợi mọi lúc
            </h1>
            <p className="mt-4 max-w-lg text-base text-blue-100 sm:text-lg">
              HomeFix kết nối bạn với đội ngũ thợ sửa chữa điện, nước, điện
              lạnh, đồ gia dụng đã được xác minh - có mặt nhanh chóng, báo giá
              rõ ràng trước khi thi công.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/booking"
                className="rounded-full bg-accent-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-accent-600"
              >
                Đặt thợ ngay
              </Link>
              <Link
                to="/services"
                className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Xem bảng giá dịch vụ
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {SERVICE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/services?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-white/10 p-6 text-center backdrop-blur transition hover:bg-white/20"
              >
                <span className="text-4xl">{cat.icon}</span>
                <span className="text-sm font-semibold">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.label} className="flex items-center gap-3">
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-sm font-medium text-gray-700">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED SERVICES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Bảng giá minh bạch"
          title="Dịch vụ sửa chữa phổ biến"
          subtitle="Giá niêm yết rõ ràng cho từng đầu việc, không phát sinh chi phí ẩn."
        />
        {isLoading ? (
          <ServiceGridSkeleton count={6} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
        <div className="mt-10 text-center">
          <Link
            to="/services"
            className="inline-block rounded-full border border-brand-600 px-6 py-2.5 text-sm font-semibold text-brand-600 transition hover:bg-brand-50"
          >
            Xem tất cả dịch vụ →
          </Link>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Quy trình"
            title="Đặt thợ chỉ với 4 bước đơn giản"
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <span className="text-3xl font-bold text-brand-100">
                  {item.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Vì sao chọn HomeFix" title="Cam kết của chúng tôi" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CHOOSE_US.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-100 p-6 text-center shadow-sm"
            >
              <span className="text-4xl">{item.icon}</span>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-brand-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Khách hàng nói gì"
            title="Hơn 1000+ khách hàng tin tưởng HomeFix"
          />
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <div
                key={item.name}
                className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"
              >
                <p className="text-sm italic text-blue-100">{item.content}</p>
                <p className="mt-4 text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-blue-200">{item.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-accent-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Bạn cần thợ sửa chữa ngay bây giờ?
            </h2>
            <p className="mt-1 text-sm text-orange-50">
              Đặt lịch chỉ trong 1 phút, thợ có mặt nhanh chóng.
            </p>
          </div>
          <Link
            to="/booking"
            className="whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-semibold text-accent-600 shadow-lg transition hover:bg-orange-50"
          >
            Đặt thợ ngay
          </Link>
        </div>
      </section>
    </div>
  );
}
