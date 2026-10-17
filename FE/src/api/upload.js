import apiClient from './client';

/**
 * Tải lên ảnh đại diện cá nhân
 * @param {File} file
 * @returns {Promise<{ avatar_url: string, user: Object }>}
 */
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

/**
 * Tải lên tài liệu KYC xác minh thợ (CCCD hoặc chứng chỉ tay nghề)
 * @param {File} file
 * @param {Object} options - { type: 'cccd' | 'certificate', cccd_number?: string }
 * @returns {Promise<{ document_url: string, type: string, user: Object }>}
 */
export async function uploadKYC(file, { type = 'cccd', cccd_number = '' } = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  if (cccd_number) {
    formData.append('cccd_number', cccd_number);
  }

  const { data } = await apiClient.post('/upload/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

/**
 * Tải lên hình ảnh dịch vụ sửa chữa (Admin)
 * @param {File} file
 * @returns {Promise<{ image_url: string }>}
 */
export async function uploadServiceImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post('/upload/service-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}
