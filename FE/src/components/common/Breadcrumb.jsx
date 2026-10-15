import { Link } from 'react-router-dom';

/** items: [{ label, to? }] - item cuối không có "to" được coi là trang hiện tại */
export default function Breadcrumb({ items }) {
  return (
    <nav aria-label="breadcrumb" className="mb-6 text-sm text-gray-500">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1">
            {index > 0 && <span className="text-gray-300">/</span>}
            {item.to ? (
              <Link to={item.to} className="hover:text-brand-600">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
