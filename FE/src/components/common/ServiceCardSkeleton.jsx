/** Skeleton hiển thị khi đang tải danh sách dịch vụ (yêu cầu checklist Frontend 1) */
export default function ServiceCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-32 bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-20 rounded-full bg-gray-200" />
        <div className="h-5 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-2/3 rounded bg-gray-200" />
        <div className="h-9 w-full rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

export function ServiceGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ServiceCardSkeleton key={index} />
      ))}
    </div>
  );
}
