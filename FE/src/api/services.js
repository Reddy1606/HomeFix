import apiClient from './client';
import { MOCK_SERVICES } from '../data/mockServices';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Lấy danh sách dịch vụ (có thể lọc theo category).
 * Backend 2 đang triển khai API GET /services — nếu API chưa sẵn sàng,
 * tự động dùng dữ liệu mẫu để Frontend 1 không bị chặn tiến độ.
 */
export async function fetchServices({ category } = {}) {
  try {
    const { data } = await apiClient.get('/services', {
      params: category ? { category } : undefined,
    });
    if (Array.isArray(data?.data?.services)) return data.data.services;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch {
    await wait(400); // mô phỏng độ trễ mạng để hiệu ứng loading hiển thị mượt
    return category
      ? MOCK_SERVICES.filter((s) => s.category === category)
      : MOCK_SERVICES;
  }
}

/** Lấy chi tiết 1 dịch vụ theo id. */
export async function fetchServiceById(id) {
  try {
    const { data } = await apiClient.get(`/services/${id}`);
    return data?.data?.service || data?.data || null;
  } catch {
    await wait(400);
    return MOCK_SERVICES.find((s) => s.id === id) || null;
  }
}

/** Format số tiền theo chuẩn VNĐ, ví dụ: 200000 -> "200.000đ" */
export function formatPrice(value) {
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`;
}

export const PRICE_UNIT_LABEL = {
  per_job: '/ lượt sửa',
  per_hour: '/ giờ',
  per_month: '/ tháng',
};
