import { Link } from 'react-router-dom';
import { formatPrice } from '../../api/services';
import { getCategoryIcon } from '../../data/mockServices';

export default function ServiceCard({ service }) {
  return (
    <Link
      to={`/services/${service.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-100"
    >
      <div className="flex h-28 items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 text-4xl transition group-hover:scale-105">
        {getCategoryIcon(service.category)}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="inline-block w-fit rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-semibold text-brand-700">
          {service.category}
        </span>
        <h3 className="text-base font-bold text-gray-900">{service.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <p className="text-lg font-extrabold text-accent-600">
            {formatPrice(service.base_price)}
          </p>
          <span className="rounded-full bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700">
            BH {service.warranty_days} ngày
          </span>
        </div>
      </div>
    </Link>
  );
}

