import { BOOKING_STATUS } from '../../utils/admin';

export function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-${status}`}>
      {BOOKING_STATUS[status] || status}
    </span>
  );
}
export function ResourceState({ loading, error, empty, reload }) {
  if (loading)
    return (
      <div className="resource-state" role="status">
        <span className="hf-spinner" />
        Đang tải dữ liệu…
      </div>
    );
  if (error)
    return (
      <div className="resource-state">
        <h2>Chưa thể tải dữ liệu</h2>
        <p role="alert">{error}</p>
        <button className="hf-button secondary" onClick={reload}>
          Thử lại
        </button>
      </div>
    );
  if (empty)
    return (
      <div className="resource-state">
        <h2>Chưa có kết quả</h2>
        <p>Thử thay đổi bộ lọc hoặc quay lại sau.</p>
      </div>
    );
  return null;
}
export function Pagination({ pagination, page, onChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <nav className="hf-pagination" aria-label="Phân trang">
      <span>
        Trang {page} / {pagination.totalPages} · {pagination.total} kết quả
      </span>
      <div>
        <button
          className="hf-button secondary small"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          ← Trước
        </button>
        <button
          className="hf-button secondary small"
          disabled={page >= pagination.totalPages}
          onClick={() => onChange(page + 1)}
        >
          Sau →
        </button>
      </div>
    </nav>
  );
}
