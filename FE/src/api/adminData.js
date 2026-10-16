import { fetchAdminBookings, fetchAdminUsers, fetchDashboard } from './admin';
import { availableTechnicians, collectPages, summarizeBookings } from '../utils/adminAnalytics';

export async function loadTechnicians(_, options = {}) {
  const [users, bookings] = await Promise.all([
    collectPages((params, opts) => fetchAdminUsers({ ...params, role: 'technician' }, opts), 'users', options),
    collectPages(fetchAdminBookings, 'bookings', options),
  ]);
  return availableTechnicians(users, bookings);
}

export async function loadDashboard(_, options = {}) {
  const [dashboard, bookings] = await Promise.all([
    fetchDashboard(options), collectPages(fetchAdminBookings, 'bookings', options),
  ]);
  return { ...dashboard, ...summarizeBookings(bookings), total_bookings: bookings.length,
    pending_bookings: bookings.filter((b) => b.status === 'pending').length,
    completed_bookings: bookings.filter((b) => b.status === 'completed').length };
}
