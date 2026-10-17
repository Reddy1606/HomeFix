import apiClient from './client';
// Backend hiện chưa có API /reviews. Chỉ bật chế độ demo khi VITE_USE_MOCK=true.
const demo = import.meta.env.VITE_USE_MOCK === 'true';
const storageKey = 'homefix_demo_reviews';
function readDemo() { try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; } }
export async function fetchBookingReview(bookingId) {
  if (demo) return readDemo()[String(bookingId)] || null;
  const { data } = await apiClient.get(`/reviews/booking/${encodeURIComponent(bookingId)}`);
  return data.data?.review || data.data || null;
}
export async function submitBookingReview(bookingId, { rating, comment }) {
  if (demo) {
    const all = readDemo();
    if (all[String(bookingId)]) throw new Error('Đơn này đã được đánh giá.');
    const review = { booking_id: bookingId, rating, comment, created_at: new Date().toISOString() };
    localStorage.setItem(storageKey, JSON.stringify({ ...all, [String(bookingId)]: review }));
    return review;
  }
  const { data } = await apiClient.post('/reviews', { booking_id: bookingId, rating, comment });
  return data.data?.review || data.data;
}
