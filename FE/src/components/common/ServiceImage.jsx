import { useState } from 'react';

/**
 * Hiển thị ảnh minh họa cho dịch vụ. Nếu không có `src` hoặc ảnh tải lỗi
 * (ví dụ dịch vụ lấy từ API thật chưa có image_url), tự động fallback về
 * icon danh mục trên nền gradient để giao diện không bị vỡ.
 */
export default function ServiceImage({ src, alt, icon, className = '', iconClassName = 'text-4xl' }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 ${className}`}
      >
        <span className={iconClassName}>{icon}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`object-cover ${className}`}
    />
  );
}
