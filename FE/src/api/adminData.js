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
    fetchDashboard(options),
    collectPages(fetchAdminBookings, 'bookings', options),
  ]);
  const summary = summarizeBookings(bookings);
  const rawRevenue = dashboard?.revenue;
  const backendRev = typeof rawRevenue === 'object' ? Number(rawRevenue?.total_revenue || 0) : Number(rawRevenue || 0);
  const rev = summary?.revenue != null ? summary.revenue : backendRev;
  const comm = summary?.commission != null ? summary.commission : Math.round(rev * 0.15);

  return {
    ...dashboard,
    ...summary,
    revenue: rev,
    commission: comm,
    total_bookings: bookings.length || dashboard?.total_bookings || 0,
    pending_bookings: bookings.filter((b) => b.status === 'pending').length,
    completed_bookings: bookings.filter((b) => b.status === 'completed').length,
  };
}
