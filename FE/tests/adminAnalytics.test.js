import test from 'node:test';
import assert from 'node:assert/strict';
import { availableTechnicians, collectPages, summarizeBookings } from '../src/utils/adminAnalytics.js';

test('Đọc đủ các trang trước khi tổng hợp, kể cả bản ghi ở trang sau', async () => {
  const requests = [];
  const data = await collectPages(async ({ page }) => {
    requests.push(page);
    return { bookings: [{ id: `b${page}` }], pagination: { total: 3, totalPages: 3 } };
  }, 'bookings');
  assert.deepEqual(requests, [1, 2, 3]);
  assert.equal(data.length, 3);
});

test('Không trả số liệu từng phần khi một trang thất bại', async () => {
  await assert.rejects(collectPages(async ({ page }) => {
    if (page === 2) throw new Error('server failure');
    return { bookings: [{ id: 'b1' }], pagination: { total: 2, totalPages: 2 } };
  }, 'bookings'), /server failure/);
});

test('Phát hiện thay đổi tổng, trùng bản ghi và thiếu phân trang', async () => {
  await assert.rejects(collectPages(async ({ page }) => ({
    bookings: [{ id: `b${page}` }], pagination: { total: page === 1 ? 2 : 3, totalPages: 2 },
  }), 'bookings'), /vừa thay đổi/);
  await assert.rejects(collectPages(async () => ({
    bookings: [{ id: 'same' }], pagination: { total: 2, totalPages: 2 },
  }), 'bookings'), /vừa thay đổi/);
  await assert.rejects(collectPages(async () => ({ bookings: [] }), 'bookings'), /phân trang/);
});

test('Danh sách rỗng và hủy tải không tạo số liệu giả', async () => {
  assert.deepEqual(await collectPages(async () => ({ bookings: [], pagination: { total: 0, totalPages: 0 } }), 'bookings'), []);
  const controller = new AbortController(); controller.abort();
  let calls = 0;
  await assert.rejects(collectPages(async () => { calls++; }, 'bookings', { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(calls, 0);
});

test('Chỉ chọn thợ active, KYC và không có đơn đang xử lý', () => {
  const technician = (id, extra = {}) => ({ id, role: 'technician', is_active: true, is_verified: true, ...extra });
  const users = [technician('free'), technician('busy'), technician('repair'), technician('warranty'), technician('unverified', { is_verified: false }), technician('locked', { is_active: false }), technician('customer', { role: 'customer' })];
  const bookings = [{ technician_id: 'busy', status: 'confirmed' }, { technician_id: 'repair', status: 'in_progress' }, { technician: { id: 'warranty' }, status: 'warranty_claim' }, { technician_id: 'free', status: 'completed' }];
  assert.deepEqual(availableTechnicians(users, bookings).map((u) => u.id), ['free']);
});

test('Doanh số chỉ tính completed, số tiền chuỗi và ranh giới tháng theo giờ VN', () => {
  const summary = summarizeBookings([
    { status: 'completed', total_price: '100000', created_at: '2026-09-30T18:00:00Z' },
    { status: 'completed', total_price: 200000, created_at: '2026-10-03T02:00:00Z' },
    { status: 'cancelled', total_price: 900000 },
    { status: 'warranty_claim', total_price: 200000 },
    { status: 'pending', total_price: 100000 },
  ]);
  assert.equal(summary.revenue, 300000);
  assert.equal(summary.commission, 45000);
  assert.deepEqual(summary.revenueSeries, [{ month: '2026-10', revenue: 300000, commission: 45000 }]);
  assert.equal(summary.statusCounts.completed, 2);
  assert.equal(Object.values(summary.statusCounts).reduce((a, b) => a + b), 5);
});

test('Không coi số tiền hoặc ngày bị thiếu là doanh số bằng 0', () => {
  for (const total_price of [null, undefined, 'bad', -10]) {
    assert.throws(() => summarizeBookings([{ status: 'completed', total_price, created_at: '2026-10-01' }]), /thiếu ngày tạo hoặc giá trị/);
  }
  assert.throws(() => summarizeBookings([{ status: 'completed', total_price: 10, created_at: 'invalid' }]), /thiếu ngày tạo hoặc giá trị/);
  const empty = summarizeBookings([]);
  assert.equal(empty.revenue, 0);
  assert.deepEqual(empty.revenueSeries, []);
});
