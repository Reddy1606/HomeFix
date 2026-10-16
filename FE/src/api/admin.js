import apiClient from './client';

// Các endpoint BE2 đề xuất trong bảng phân công. Xem FE3_HANDOFF.md.
export const fetchDashboard = (options = {}) =>
  apiClient.get('/admin/dashboard', options).then((res) => res.data.data);
export const fetchAdminBookings = (params, options = {}) =>
  apiClient
    .get('/admin/bookings', { ...options, params })
    .then((res) => res.data.data);
export const fetchAdminServices = (params, options = {}) =>
  apiClient
    .get('/admin/services', { ...options, params })
    .then((res) => res.data.data);
export const updateBookingStatus = (id, status) =>
  apiClient
    .put(`/admin/bookings/${encodeURIComponent(id)}/status`, { status })
    .then((res) => res.data.data);
export const createService = (payload) =>
  apiClient.post('/admin/services', payload).then((res) => res.data.data);
export const updateService = (id, payload) =>
  apiClient
    .put(`/admin/services/${encodeURIComponent(id)}`, payload)
    .then((res) => res.data.data);
