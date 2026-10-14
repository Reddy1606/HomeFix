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

const TESTIMONIALS = [
  { name: 'Lan Anh', role: 'Quận 7, TP.HCM', content: 'Đặt sáng, trưa thợ tới ngay, giá rõ ràng.', rating: 5 },
  { name: 'Minh Khoa', role: 'TP. Thủ Đức', content: 'Bảo hành thật, hư lại sửa miễn phí.', rating: 5 },
  { name: 'Thu Hương', role: 'Bình Thạnh', content: 'Giá niêm yết sẵn, không lo chặt chém.', rating: 5 },
];

function Stars({ count }) {
  return (
    <div className="flex gap-0.5 text-accent-400">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i}>★</span>
      ))}
    </div>
  );
}

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

          <div className="grid grid-cols-2 gap-4">
            {SERVICE_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/services?category=${encodeURIComponent(cat.name)}`}
                className="group flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/10 p-7 text-center ring-1 ring-white/15 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/20"
              >
                <span className="text-4xl transition group-hover:scale-110">
                  {cat.icon}
                </span>
                <span className="text-sm font-semibold">{cat.name}</span>
              </Link>
            ))}
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
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
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

      {/* TESTIMONIALS */}
      <section className="bg-brand-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Đánh giá"
            title="1000+ khách hàng tin tưởng"
            variant="light"
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <div
                key={item.name}
                className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:bg-white/10"
              >
                <Stars count={item.rating} />
                <p className="mt-3 text-sm text-blue-50">“{item.content}”</p>
                <div className="mt-4 flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-500 text-xs font-bold">
                    {item.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-xs font-semibold">{item.name}</p>
                    <p className="text-[11px] text-blue-300">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
