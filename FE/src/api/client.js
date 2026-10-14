import axios from 'axios';

// Không hardcode URL API: luôn đọc từ biến môi trường VITE_API_URL (xem .env.example)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
});

// Gắn token đăng nhập (nếu có) vào mọi request, theo chuẩn API Contract của nhóm
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = token;
  }
  return config;
});

export default apiClient;
