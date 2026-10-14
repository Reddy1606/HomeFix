import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Breadcrumb from '../components/common/Breadcrumb';
import ServiceCard from '../components/common/ServiceCard';
import { ServiceGridSkeleton } from '../components/common/ServiceCardSkeleton';
import { fetchServices } from '../api/services';
import { SERVICE_CATEGORIES } from '../data/mockServices';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || '';
  const [keyword, setKeyword] = useState('');
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError('');
    fetchServices({ category: activeCategory || undefined })
      .then((data) => {
        if (isMounted) setServices(data);
      })
      .catch(() => {
        if (isMounted) setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  const filteredServices = useMemo(() => {
    if (!keyword.trim()) return services;
    const normalized = keyword.trim().toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(normalized));
  }, [services, keyword]);

  const handleSelectCategory = (categoryName) => {
    if (!categoryName) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryName);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[{ label: 'Trang chủ', to: '/' }, { label: 'Dịch vụ' }]}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Danh sách dịch vụ sửa chữa
        </h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Bảng giá niêm yết minh bạch cho từng đầu việc. Chọn danh mục hoặc tìm
          kiếm dịch vụ bạn đang cần.
        </p>
      </div>

      {/* Search + Filter */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleSelectCategory('')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCategory === ''
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          {SERVICE_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => handleSelectCategory(cat.name)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategory === cat.name
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm dịch vụ, ví dụ: sửa máy lạnh..."
            className="w-full rounded-full border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </div>

      {isLoading && <ServiceGridSkeleton count={6} />}

      {!isLoading && error && (
        <p className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      {!isLoading && !error && filteredServices.length === 0 && (
        <p className="rounded-lg bg-gray-50 p-8 text-center text-gray-500">
          Không tìm thấy dịch vụ phù hợp. Hãy thử từ khóa hoặc danh mục khác.
        </p>
      )}

      {!isLoading && !error && filteredServices.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
