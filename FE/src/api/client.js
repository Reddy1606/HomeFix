import axios from 'axios';

// Không hardcode URL API: luôn đọc từ biến môi trường VITE_API_URL (xem .env.example)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Gắn token đăng nhập (nếu có) vào mọi request, theo chuẩn API Contract của nhóm
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Sai mật khẩu hiện tại cũng trả 401: giữ nguyên phiên trong trường hợp đó.
    const url = error.config?.url || '';
    const credentialRequest = [
      '/auth/login',
      '/auth/register',
      '/auth/change-password',
    ].some((path) => url === path);
    const sentToken = error.config?.headers?.Authorization;
    if (
      error.response?.status === 401 &&
      !credentialRequest &&
      sentToken === `Bearer ${localStorage.getItem('token')}`
    ) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('homefix:session-expired'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
