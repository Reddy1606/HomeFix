import apiClient from './client';

export async function loginAccount(payload) {
  return (await apiClient.post('/auth/login', payload)).data.data;
}
export async function registerAccount(payload) {
  return (await apiClient.post('/auth/register', payload)).data.data;
}
export async function getProfile() {
  return (await apiClient.get('/auth/me')).data.data.user;
}
export async function updateProfile(payload) {
  return (await apiClient.put('/auth/me', payload)).data.data.user;
}
export async function changePassword(payload) {
  return (await apiClient.post('/auth/change-password', payload)).data;
}
export async function becomeTechnician(payload = {}) {
  return (await apiClient.post('/auth/become-technician', payload)).data.data;
}

