
import { useState } from 'react';

export default function BookingReview({
  bookingId,
  status,
  onSubmitReview
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Chỉ đánh giá khi đơn đã hoàn thành
  if (status !== 'completed') {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Vui lòng chọn số sao đánh giá.');
      return;
    }

    if (!comment.trim()) {
      setError('Vui lòng nhập nhận xét.');
      return;
    }

    if (!bookingId || typeof onSubmitReview !== 'function') {
      setError('Chức năng gửi đánh giá chưa được kết nối.');
      return;
    }

    try {
      setLoading(true);

      await onSubmitReview({
        bookingId,
        rating,
        comment: comment.trim()
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Không thể gửi đánh giá.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="booking-review">
        <h3>Đánh giá dịch vụ</h3>
        <p>✅ Cảm ơn bạn đã đánh giá dịch vụ!</p>
      </div>
    );
  }

  return (
    <div className="booking-review">
      <h3>Đánh giá thợ sửa chữa</h3>
      <p>Hãy chia sẻ trải nghiệm của bạn về dịch vụ.</p>

      <form onSubmit={handleSubmit}>
        <div className="review-stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              aria-label={`Đánh giá ${star} sao`}
              style={{
                fontSize: '32px',
                color:
                  star <= (hoverRating || rating)
                    ? '#f5a623'
                    : '#cccccc',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              ★
            </button>
          ))}
        </div>

        <p>Đã chọn: {rating}/5 sao</p>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Nhập nhận xét về thợ sửa chữa..."
          rows={4}
          maxLength={500}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}
        />

        {error && (
          <p style={{ color: 'red' }}>{error}</p>
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
        </button>
      </form>
    </div>
  );
}
