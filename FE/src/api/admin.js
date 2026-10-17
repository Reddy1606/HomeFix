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
export const fetchAdminBookingById = (id, options = {}) =>
  apiClient.get(`/admin/bookings/${encodeURIComponent(id)}`, options)
    .then((res) => res.data.data);
export const updateBookingStatus = (id, status, technicianId) =>
  apiClient
    .put(`/admin/bookings/${encodeURIComponent(id)}/status`, {
      status,
      ...(technicianId && { technician_id: technicianId }),
    })
    .then((res) => res.data.data);
export const createService = (payload) =>
  apiClient.post('/admin/services', payload).then((res) => res.data.data);
export const updateService = (id, payload) =>
  apiClient
    .put(`/admin/services/${encodeURIComponent(id)}`, payload)
    .then((res) => res.data.data);

// ==================== QUẢN LÝ TÀI KHOẢN (USERS) ====================
export const fetchAdminUsers = (params, options = {}) =>
  apiClient
    .get('/admin/users', { ...options, params })
    .then((res) => res.data.data);

export const fetchAdminUserById = (id, options = {}) =>
  apiClient
    .get(`/admin/users/${encodeURIComponent(id)}`, options)
    .then((res) => res.data.data?.user);

export const verifyTechnician = (id, verified) =>
  apiClient
    .put(`/admin/users/${encodeURIComponent(id)}/verify`, { verified })
    .then((res) => res.data.data?.user);

export const toggleUserStatus = (id, is_active) =>
  apiClient
    .put(`/admin/users/${encodeURIComponent(id)}/status`, { is_active })
    .then((res) => res.data.data?.user);

export const updateUserRole = (id, role) =>
  apiClient
    .put(`/admin/users/${encodeURIComponent(id)}/role`, { role })
    .then((res) => res.data.data?.user);


