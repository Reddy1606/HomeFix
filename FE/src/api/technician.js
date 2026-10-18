import apiClient from './client';

/**
 * Lấy danh sách việc mới đang chờ nhận việc (dành cho thợ đã duyệt KYC)
 */
export async function getAvailableJobs(params = {}) {
  const { data } = await apiClient.get('/technician/jobs/available', { params });
  return data.data;
}

/**
 * Thợ chủ động nhận một đơn việc
 * @param {string} bookingId
 */
export async function claimJob(bookingId) {
  const { data } = await apiClient.post(`/technician/jobs/${bookingId}/claim`);
  return data;
}

/**
 * Lấy danh sách các đơn việc của thợ đang đăng nhập (đã nhận / được giao)
 * @param {Object} params - { status, page, limit }
 */
export async function getMyJobs(params = {}) {
  const { data } = await apiClient.get('/technician/jobs/my', { params });
  return data.data;
}

/**
 * Thợ cập nhật tiến độ công việc (in_progress | completed)
 * @param {string} bookingId
 * @param {'in_progress' | 'completed'} status
 */
export async function updateJobStatus(bookingId, status) {
  const { data } = await apiClient.put(`/technician/jobs/${bookingId}/status`, { status });
  return data;
}
