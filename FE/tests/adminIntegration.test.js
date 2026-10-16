import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

test('Tích hợp Axios, API phân trang và render Dashboard với hợp đồng backend hiện tại', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, logLevel: 'silent' });
  const originalStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => 'test-token' };
  try {
    const client = (await server.ssrLoadModule('/src/api/client.js')).default;
    const { loadDashboard, loadTechnicians } = await server.ssrLoadModule('/src/api/adminData.js');
    const { updateBookingStatus, fetchAdminBookingById } = await server.ssrLoadModule('/src/api/admin.js');
    const { default: DashboardCharts } = await server.ssrLoadModule('/src/components/admin/DashboardCharts.jsx');
    const completed = Array.from({ length: 101 }, (_, i) => ({ id: `b${i}`, status: 'completed', total_price: '100000', created_at: '2026-10-01T00:00:00Z' }));
    const bookings = [...completed, { id: 'busy', status: 'confirmed', technician_id: 'busy-worker' }];
    const users = [...Array.from({ length: 100 }, (_, i) => ({ id: `u${i}`, role: 'technician', is_active: true, is_verified: false })),
      { id: 'free-worker', role: 'technician', is_active: true, is_verified: true },
      { id: 'busy-worker', role: 'technician', is_active: true, is_verified: true }];
    const calls = [];
    let failSecondPage = false;
    client.defaults.adapter = async (config) => {
      calls.push(config);
      assert.equal(config.headers.Authorization, 'Bearer test-token');
      if (failSecondPage && config.url === '/admin/bookings' && config.params.page === 2) throw new Error('second page failed');
      let data;
      if (config.url === '/admin/dashboard') data = { total_services: 4, completed_bookings: 99 };
      else if (config.url === '/admin/bookings' || config.url === '/admin/users') {
        const key = config.url.endsWith('users') ? 'users' : 'bookings';
        const rows = key === 'users' ? users : bookings;
        const { page, limit } = config.params;
        if (key === 'users') assert.equal(config.params.role, 'technician');
        data = { [key]: rows.slice((page - 1) * limit, page * limit), pagination: { total: rows.length, totalPages: Math.ceil(rows.length / limit) } };
      } else if (config.method === 'put') data = { booking: { id: 'order', ...JSON.parse(config.data) } };
      else data = { booking: { id: 'order', status: 'pending' }, allowed_next_statuses: ['confirmed', 'cancelled'] };
      return { data: { success: true, data }, status: 200, statusText: 'OK', headers: {}, config };
    };
    const dashboard = await loadDashboard();
    assert.equal(dashboard.total_bookings, 102);
    assert.equal(dashboard.completed_bookings, 101);
    assert.equal(dashboard.revenue, 10100000);
    assert.equal(dashboard.commission, 1515000);
    assert.deepEqual((await loadTechnicians()).map((u) => u.id), ['free-worker']);
    assert.ok(calls.some((c) => c.url === '/admin/users' && c.params.page === 2));
    assert.equal((await fetchAdminBookingById('order')).allowed_next_statuses[0], 'confirmed');
    await updateBookingStatus('order', 'confirmed', 'free-worker');
    assert.deepEqual(JSON.parse(calls.at(-1).data), { status: 'confirmed', technician_id: 'free-worker' });
    await updateBookingStatus('order', 'cancelled');
    assert.deepEqual(JSON.parse(calls.at(-1).data), { status: 'cancelled' });
    const markup = renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(DashboardCharts, { data: dashboard })));
    assert.equal((markup.match(/class="revenue-row"/g) || []).length, 6);
    assert.ok(markup.includes('Tỷ lệ trạng thái đơn'));
    assert.ok(markup.includes('Theo tháng tạo đơn'));
    assert.ok(markup.includes('status=completed'));
    assert.ok(!markup.includes('NaN') && !markup.includes('Infinity'));
    failSecondPage = true;
    await assert.rejects(loadDashboard(), /second page failed/);
  } finally {
    globalThis.localStorage = originalStorage;
    await server.close();
  }
});
