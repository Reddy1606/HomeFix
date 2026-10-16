
const STORAGE_KEY = 'homefix_bookings';

export function getMockBookings() {
  try {
    const data = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getMockAdminBookings(params = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Number(params.limit) || 10);

  let bookings = getMockBookings().map((item) => ({
    ...item,
    contact_name: item.name || item.contact_name,
    contact_phone: item.phone || item.contact_phone,
    services: {
      name: typeof item.service === 'string'
        ? item.service
        : item.service?.name || 'Dịch vụ sửa chữa'
    },
    scheduled_at: item.date || item.scheduled_at,
    created_at: item.createdAt || item.created_at,
    status: item.status === 'Đang chờ'
      ? 'pending'
      : item.status || 'pending',
    booking_type: 'scheduled',
    total_price: item.total_price ?? null,
    isDemo: true
  }));

  if (params.status) {
    bookings = bookings.filter(
      (item) => item.status === params.status
    );
  }

  if (params.search) {
    const keyword = params.search.toLowerCase();

    bookings = bookings.filter((item) =>
      [
        item.id,
        item.contact_name,
        item.contact_phone
      ].some((value) =>
        String(value || '').toLowerCase().includes(keyword)
      )
    );
  }

  bookings.sort((a, b) =>
    new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  const total = bookings.length;

  return {
    bookings: bookings.slice(
      (page - 1) * limit,
      page * limit
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export function getMockDashboard() {
  const bookings = getMockAdminBookings({
    page: 1,
    limit: 100000
  }).bookings;

  const status_counts = {
    pending: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    warranty_claim: 0
  };

  bookings.forEach((item) => {
    if (status_counts[item.status] !== undefined) {
      status_counts[item.status]++;
    }
  });

  return {
    total_bookings: bookings.length,
    pending_bookings: status_counts.pending,
    completed_bookings: status_counts.completed,
    total_services: 0,
    status_counts,
    recent_bookings: bookings.slice(0, 5)
  };
}

export function updateMockBookingStatus(id, status) {
  const bookings = getMockBookings();
  const index = bookings.findIndex(
    (item) => String(item.id) === String(id)
  );

  if (index === -1) {
    throw new Error('Không tìm thấy đơn hàng');
  }

  bookings[index] = {
    ...bookings[index],
    status
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(bookings)
  );

  return bookings[index];
}
