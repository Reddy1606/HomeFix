import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from '../components/common/SectionHeading';
import ServiceCard from '../components/common/ServiceCard';
import { ServiceGridSkeleton } from '../components/common/ServiceCardSkeleton';
import { fetchServices } from '../api/services';
import { SERVICE_CATEGORIES } from '../data/mockServices';

const TRUST_BADGES = [
  { icon: '🪪', label: 'Thợ đã xác minh' },
  { icon: '💰', label: 'Giá niêm yết' },
  { icon: '🛡️', label: 'Bảo hành 7-30 ngày' },
  { icon: '⏱️', label: 'Có mặt trong 30p' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Chọn dịch vụ', icon: '🧰' },
  { step: '02', title: 'Đặt lịch', icon: '📅' },
  { step: '03', title: 'Thợ đến sửa', icon: '🧑‍🔧' },
  { step: '04', title: 'Bảo hành', icon: '✅' },
];

const WHY_CHOOSE_US = [
  { icon: '✅', title: 'An tâm về thợ', description: 'Xác minh CCCD & lý lịch' },
  { icon: '🧾', title: 'Minh bạch giá', description: 'Niêm yết rõ ràng' },
  { icon: '📲', title: 'Tiện lợi', description: 'Đặt lịch 24/7' },
  { icon: '🔄', title: 'Bảo hành', description: 'Sửa lại miễn phí' },
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
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-800 via-brand-600 to-brand-500 text-white">
        <div className="bg-blob -top-20 -left-20 h-80 w-80 bg-accent-400" />
        <div className="bg-blob top-40 -right-10 h-96 w-96 bg-brand-300" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold ring-1 ring-white/20">
              🏠 Gọi thợ tại nhà #1
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              An tâm <span className="text-gradient">gọi thợ</span>
              <br />
              sửa chữa tại nhà
            </h1>
            <p className="mt-4 max-w-md text-base text-blue-100/90">
              Minh bạch về giá · Tiện lợi mọi lúc
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/booking"
                className="rounded-full bg-accent-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-accent-500/30 transition hover:scale-105 hover:bg-accent-600"
              >
                Đặt thợ ngay
              </Link>
              <Link
                to="/services"
                className="rounded-full bg-white/10 px-7 py-3.5 text-sm font-bold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20"
              >
                Xem bảng giá
              </Link>
            </div>
          </div>

          <div>
            <div className="relative mb-5 flex h-48 items-center justify-center overflow-hidden rounded-3xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md sm:h-56">
              <div className="absolute h-32 w-32 rounded-full bg-white/20 blur-2xl" />
              <span className="relative text-7xl drop-shadow-lg sm:text-8xl">🏠</span>
              <span className="animate-float-slow absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-lg sm:h-14 sm:w-14 sm:text-2xl">
                🔧
              </span>
              <span
                className="animate-float-slow absolute right-6 top-8 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-500 text-lg shadow-lg sm:h-12 sm:w-12 sm:text-xl"
                style={{ animationDelay: '0.6s' }}
              >
                ❄️
              </span>
              <span
                className="animate-float-slow absolute bottom-7 left-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-lg shadow-lg sm:h-12 sm:w-12 sm:text-xl"
                style={{ animationDelay: '1.2s' }}
              >
                💡
              </span>
              <span
                className="animate-float-slow absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-lg sm:h-14 sm:w-14 sm:text-2xl"
                style={{ animationDelay: '0.3s' }}
              >
                🪛
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {SERVICE_CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/services?category=${encodeURIComponent(cat.name)}`}
                  className="group flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/10 p-5 text-center ring-1 ring-white/15 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/20"
                >
                  <span className="text-3xl transition group-hover:scale-110">
                    {cat.icon}
                  </span>
                  <span className="text-sm font-semibold">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* TRUST BADGES - dải nổi bật cuối hero */}
        <div className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur-md lg:grid-cols-4">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.label} className="flex items-center gap-2.5 px-2 py-1">
                <span className="text-xl">{badge.icon}</span>
                <span className="text-xs font-semibold sm:text-sm">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED SERVICES */}
      <section className="relative overflow-hidden bg-brand-50 py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(37,99,235,0.28) 1.8px, transparent 1.8px)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="bg-blob -left-16 top-0 h-80 w-80 bg-brand-300 opacity-50" />
        <div className="bg-blob -right-16 bottom-0 h-96 w-96 bg-accent-200 opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/40 to-white" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Bảng giá" title="Dịch vụ phổ biến" />
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
              className="inline-flex items-center gap-1 rounded-full border-2 border-brand-600 px-6 py-2.5 text-sm font-bold text-brand-600 transition hover:bg-brand-600 hover:text-white"
            >
              Xem tất cả →
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Quy trình" title="4 bước đơn giản" />
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="group rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl transition group-hover:bg-brand-600 group-hover:text-white">
                  {item.icon}
                </div>
                <span className="mt-3 block text-xs font-bold text-brand-300">
                  BƯỚC {item.step}
                </span>
                <h3 className="mt-1 text-base font-bold text-gray-900">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section id="about" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Vì sao HomeFix" title="Cam kết của chúng tôi" />
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {WHY_CHOOSE_US.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl bg-gradient-to-b from-brand-50 to-white p-6 text-center ring-1 ring-brand-100 transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="text-3xl">{item.icon}</span>
              <h3 className="mt-3 text-base font-bold text-gray-900">
                {item.title}
              </h3>
              <p className="mt-1 text-xs text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-gradient-to-r from-accent-500 to-accent-600">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 py-12 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
          <h2 className="text-2xl font-extrabold text-white">
            Cần thợ ngay bây giờ?
          </h2>
          <Link
            to="/booking"
            className="whitespace-nowrap rounded-full bg-white px-7 py-3.5 text-sm font-bold text-accent-600 shadow-xl transition hover:scale-105"
          >
            Đặt thợ ngay →
          </Link>
        </div>
      </section>
    </div>
  );
}
