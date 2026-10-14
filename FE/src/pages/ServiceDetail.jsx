import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import ServiceCard from '../components/common/ServiceCard';
import { fetchServiceById, fetchServices, formatPrice, PRICE_UNIT_LABEL } from '../api/services';
import { getCategoryIcon } from '../data/mockServices';

const PROCESS_STEPS = [
  'Thợ liên hệ xác nhận lịch hẹn trong vòng 5 phút.',
  'Thợ có mặt đúng giờ, khảo sát và báo giá chi tiết trước khi sửa.',
  'Tiến hành sửa chữa, thay thế vật tư chính hãng (nếu có).',
  'Nghiệm thu cùng khách hàng và thanh toán minh bạch.',
];

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-64 rounded-2xl bg-gray-200" />
      <div className="mt-6 h-6 w-1/3 rounded bg-gray-200" />
      <div className="mt-3 h-8 w-2/3 rounded bg-gray-200" />
      <div className="mt-4 h-4 w-full rounded bg-gray-200" />
      <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />
    </div>
  );
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setNotFound(false);

    fetchServiceById(id).then((data) => {
      if (!isMounted) return;
      if (!data) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      setService(data);
      fetchServices({ category: data.category }).then((list) => {
        if (!isMounted) return;
        setRelatedServices(list.filter((s) => s.id !== data.id).slice(0, 3));
        setIsLoading(false);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <span className="text-5xl">🔍</span>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Không tìm thấy dịch vụ
        </h1>
        <p className="mt-2 text-gray-500">
          Dịch vụ bạn tìm không tồn tại hoặc đã ngừng cung cấp.
        </p>
        <Link
          to="/services"
          className="mt-6 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Quay lại danh sách dịch vụ
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: 'Trang chủ', to: '/' },
          { label: 'Dịch vụ', to: '/services' },
          { label: service ? service.name : 'Đang tải...' },
        ]}
      />

      {isLoading || !service ? (
        <DetailSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <div className="flex h-64 items-center justify-center rounded-2xl bg-brand-50 text-8xl lg:h-full">
                {getCategoryIcon(service.category)}
              </div>
            </div>

            <div className="lg:col-span-3">
              <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">
                {service.category}
              </span>
              <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                {service.name}
              </h1>
              <p className="mt-3 text-gray-600">{service.description}</p>

              <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-3 rounded-2xl bg-gray-50 p-5">
                <div>
                  <p className="text-sm text-gray-500">Giá niêm yết</p>
                  <p className="text-3xl font-bold text-accent-600">
                    {formatPrice(service.base_price)}
                    <span className="ml-1 text-sm font-normal text-gray-400">
                      {PRICE_UNIT_LABEL[service.price_unit] || ''}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bảo hành</p>
                  <p className="text-lg font-semibold text-green-700">
                    {service.warranty_days} ngày
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate(`/booking?service=${service.id}`)}
                  className="rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-accent-600"
                >
                  Đặt lịch ngay
                </button>
                <Link
                  to="/services"
                  className="rounded-full border border-gray-200 px-6 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  ← Quay lại danh sách dịch vụ
                </Link>
              </div>
            </div>
          </div>

          {/* QUY TRÌNH THỰC HIỆN */}
          <div className="mt-14">
            <h2 className="text-xl font-bold text-gray-900">
              Quy trình thực hiện dịch vụ
            </h2>
            <ol className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PROCESS_STEPS.map((step, index) => (
                <li
                  key={step}
                  className="rounded-xl border border-gray-100 p-4 text-sm text-gray-600 shadow-sm"
                >
                  <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* DỊCH VỤ LIÊN QUAN */}
          {relatedServices.length > 0 && (
            <div className="mt-14">
              <h2 className="text-xl font-bold text-gray-900">
                Dịch vụ liên quan
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedServices.map((related) => (
                  <ServiceCard key={related.id} service={related} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
