import { Link } from 'react-router-dom';
import { formatPrice, PRICE_UNIT_LABEL } from '../../api/services';
import { getCategoryIcon } from '../../data/mockServices';

export default function ServiceCard({ service }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-32 items-center justify-center bg-brand-50 text-5xl">
        {getCategoryIcon(service.category)}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="inline-block w-fit rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
          {service.category}
        </span>
        <h3 className="text-base font-semibold text-gray-900">{service.name}</h3>
        <p className="line-clamp-2 flex-1 text-sm text-gray-500">
          {service.description}
        </p>
        <div className="flex items-end justify-between pt-2">
          <div>
            <p className="text-lg font-bold text-accent-600">
              {formatPrice(service.base_price)}
            </p>
            <p className="text-xs text-gray-400">
              {PRICE_UNIT_LABEL[service.price_unit] || ''}
            </p>
          </div>
          <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
            Bảo hành {service.warranty_days} ngày
          </span>
        </div>
        <Link
          to={`/services/${service.id}`}
          className="mt-2 block rounded-lg bg-brand-600 py-2 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
