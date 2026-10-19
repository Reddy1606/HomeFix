import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import {
  getAvailableJobs,
  claimJob,
  getMyJobs,
  updateJobStatus,
} from '../../api/technician';
import { formatBookingCode } from '../../utils/bookingCode';

const STATUS_LABELS = {
  pending: { label: 'Chờ nhận việc', bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
  confirmed: { label: 'Thợ đang đến', bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' },
  in_progress: { label: 'Đang sửa chữa', bg: '#f3e8ff', color: '#7e22ce', border: '#e9d5ff' },
  completed: { label: 'Đã hoàn thành', bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  cancelled: { label: 'Đã hủy', bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  warranty_claim: { label: 'Yêu cầu bảo hành', bg: '#ffe4e6', color: '#be123c', border: '#fecdd3' },
};

function formatVnd(amount) {
  if (amount == null) return '0 đ';
  return Number(amount).toLocaleString('vi-VN') + ' đ';
}

function formatDateTime(isoStr) {
  if (!isoStr) return 'Tức thì (trong 30-60 phút)';
  try {
    const d = new Date(isoStr);
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return isoStr;
  }
}

export default function TechnicianJobs() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'my-jobs'
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [isVerified, setIsVerified] = useState(user?.is_verified ?? false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [myJobsFilter, setMyJobsFilter] = useState(''); // '' | 'active' | 'completed'
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Tải danh sách đơn
  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'available') {
        const res = await getAvailableJobs();
        setAvailableJobs(res.bookings || []);
        setIsVerified(res.is_verified);
      } else {
        const res = await getMyJobs();
        setMyJobs(res.bookings || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách việc:', err);
      setError(err.response?.data?.message || 'Không thể tải danh sách công việc. Vui lòng kiểm tra lại kết nối.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Xử lý khi thợ bấm Nhận việc
  const handleClaim = (job) => {
    setConfirmDialog({
      title: 'Xác nhận tiếp nhận công việc',
      icon: '⚡',
      confirmText: 'Đồng ý nhận việc ngay',
      confirmColor: '#16a34a',
      message: (
        <div>
          <p style={{ margin: '0 0 10px 0' }}>
            Bạn muốn nhận đơn việc sửa chữa <strong>"{job.services?.name || 'Dịch vụ'}"</strong>?
          </p>
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '0.88rem', border: '1px solid #e2e8f0' }}>
            <div>📍 <strong>Địa chỉ:</strong> {job.address}</div>
            <div>💰 <strong>Thu nhập dự kiến:</strong> {formatVnd(job.total_price)}</div>
            <div>⏱️ <strong>Thời gian:</strong> {job.booking_type === 'immediate' ? '⚡ Cần gấp trong 30-60 phút' : `📅 Hẹn lúc ${formatDateTime(job.scheduled_at)}`}</div>
          </div>
          <p style={{ fontSize: '0.83rem', color: '#b45309', margin: '10px 0 0 0' }}>
            ⚠️ Sau khi nhận đơn, bạn cần chủ động liên hệ với khách hàng để thông báo thời gian có mặt.
          </p>
        </div>
      ),
      onConfirm: async () => {
        setBusy(true);
        setError('');
        setNotice('');
        try {
          await claimJob(job.id);
          setNotice(`✅ Bạn đã tiếp nhận thành công đơn việc ${formatBookingCode(job)}! Hãy kiểm tra tab "Công việc của tôi" để liên hệ khách.`);
          // Chuyển sang tab Công việc của tôi
          setActiveTab('my-jobs');
        } catch (err) {
          setError(err.response?.data?.message || 'Không thể nhận việc. Có thể đơn đã có người nhận trước.');
        } finally {
          setBusy(false);
          loadData();
        }
      },
    });
  };

  // Xử lý chuyển tiến độ: Bắt đầu làm hoặc Hoàn thành
  const handleUpdateStatus = (job, newStatus) => {
    const isCompleted = newStatus === 'completed';
    setConfirmDialog({
      title: isCompleted ? 'Xác nhận hoàn thành sửa chữa' : 'Xác nhận bắt đầu sửa chữa',
      icon: isCompleted ? '✅' : '🚗',
      confirmText: isCompleted ? 'Xác nhận hoàn tất' : 'Bắt đầu sửa chữa',
      confirmColor: isCompleted ? '#16a34a' : '#2563eb',
      message: isCompleted
        ? `Bạn đã hoàn tất công việc cho đơn ${formatBookingCode(job)}. Hệ thống sẽ ghi nhận hoàn thành và kích hoạt thời hạn bảo hành cho khách.`
        : `Bạn đã có mặt tại nhà khách hàng và bắt đầu tiến hành sửa chữa cho đơn ${formatBookingCode(job)}?`,
      onConfirm: async () => {
        setBusy(true);
        setError('');
        setNotice('');
        try {
          await updateJobStatus(job.id, newStatus);
          setNotice(isCompleted ? '🎉 Tuyệt vời! Bạn đã hoàn thành công việc sửa chữa.' : '🔧 Đã chuyển đơn sang trạng thái Đang sửa chữa.');
          loadData();
        } catch (err) {
          setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tiến độ.');
        } finally {
          setBusy(false);
        }
      },
    });
  };

  // Lọc đơn công việc của tôi
  const filteredMyJobs = myJobs.filter((job) => {
    if (myJobsFilter === 'active') {
      return ['confirmed', 'in_progress', 'warranty_claim'].includes(job.status);
    }
    if (myJobsFilter === 'completed') {
      return job.status === 'completed';
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 16px' }}>
      {/* Tiêu đề trang */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.05em', color: '#d97706', textTransform: 'uppercase' }}>
            ⚡ CỔNG ĐIỀU PHỐI DÀNH CHO THỢ SỬA CHỮA
          </span>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 8px' }}>
            Nhận việc & Quản lý công việc
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Tiếp nhận ngay các đơn cần gấp trong 30-60 phút, nhận lịch hẹn trước và cập nhật tiến độ sửa chữa.
          </p>
        </div>

        <button
          className="hf-button secondary"
          disabled={loading || busy}
          onClick={loadData}
          style={{ padding: '8px 16px', fontWeight: 600 }}
        >
          ↻ Làm mới danh sách
        </button>
      </div>

      {/* Cảnh báo chưa duyệt KYC */}
      {!isVerified && (
        <div
          style={{
            background: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>⚠️</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#92400e' }}>
                Hồ sơ thợ của bạn chưa được kích hoạt KYC
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#b45309' }}>
                Bạn cần hoàn tất tải ảnh CCCD để Quản trị viên duyệt hồ sơ trước khi có thể bấm nhận các đơn việc.
              </span>
            </div>
          </div>
          <Link
            to="/profile"
            className="hf-button small"
            style={{ background: '#d97706', borderColor: '#d97706', color: '#ffffff', fontWeight: 700 }}
          >
            🪪 Nộp hồ sơ KYC ngay →
          </Link>
        </div>
      )}

      {/* Toast thông báo nổi trên đầu */}
      {(notice || error) && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100020,
            minWidth: '340px',
            maxWidth: '90vw',
            padding: '14px 20px',
            borderRadius: '12px',
            background: error ? '#fef2f2' : '#f0fdf4',
            border: `1.5px solid ${error ? '#fca5a5' : '#86efac'}`,
            color: error ? '#991b1b' : '#166534',
            boxShadow: '0 20px 30px -8px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            fontWeight: 600,
            fontSize: '0.92rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.25rem' }}>{error ? '⚠️' : '✅'}</span>
            <span>{error || notice}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setNotice('');
              setError('');
            }}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: error ? '#991b1b' : '#166534', fontSize: '1.25rem', fontWeight: 700 }}
          >
            ×
          </button>
        </div>
      )}

      {/* Thẻ chuyển Tab chính */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('available')}
          style={{
            padding: '12px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'available' ? '3px solid #d97706' : '3px solid transparent',
            color: activeTab === 'available' ? '#d97706' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
          }}
        >
          <span>⚡ Sàn việc mới cần thợ</span>
          <span style={{ background: activeTab === 'available' ? '#fef3c7' : '#f1f5f9', color: activeTab === 'available' ? '#b45309' : '#64748b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
            {availableJobs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my-jobs')}
          style={{
            padding: '12px 20px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'my-jobs' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'my-jobs' ? '#2563eb' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-2px',
          }}
        >
          <span>📋 Công việc của tôi</span>
          <span style={{ background: activeTab === 'my-jobs' ? '#eff6ff' : '#f1f5f9', color: activeTab === 'my-jobs' ? '#1d4ed8' : '#64748b', padding: '2px 8px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 800 }}>
            {myJobs.length}
          </span>
        </button>
      </div>

      {/* ==================== TAB 1: SÀN VIỆC MỚI ==================== */}
      {activeTab === 'available' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Hiển thị các đơn khách vừa tạo đang chờ thợ tiếp nhận:
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
              Đang tải danh sách việc mới...
            </div>
          ) : availableJobs.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>☕</div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 700, margin: '0 0 6px' }}>
                Hiện chưa có đơn việc mới nào đang chờ
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 18px' }}>
                Khi khách hàng đặt dịch vụ khẩn cấp hoặc đặt lịch hẹn trước, đơn việc sẽ xuất hiện tức thì tại đây để bạn bấm nhận.
              </p>
              <button className="hf-button secondary small" onClick={loadData}>
                ↻ Bấm để kiểm tra lại
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '18px' }}>
              {availableJobs.map((job) => {
                const isImmediate = job.booking_type === 'immediate';
                const isPriority = job.is_priority || (typeof job.description === 'string' && job.description.includes('ƯU TIÊN VIP'));
                const isWarranty = job.is_warranty_claim || (typeof job.description === 'string' && job.description.includes('BẢO HÀNH'));

                return (
                  <div
                    key={job.id}
                    style={{
                      background: isPriority ? '#fffdf5' : '#ffffff',
                      borderRadius: '16px',
                      border: isPriority ? '2px solid #f59e0b' : '1.5px solid #e2e8f0',
                      padding: '20px',
                      boxShadow: isPriority ? '0 10px 20px -3px rgba(245, 158, 11, 0.2)' : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <div>
                      {/* Huy hiệu VIP nếu là khách mua gói năm */}
                      {isPriority && (
                        <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff', padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.25)' }}>
                          <span>👑</span>
                          <span>ĐƠN ƯU TIÊN VIP (Khách gói năm - Nhận ngay)</span>
                        </div>
                      )}

                      {/* Huy hiệu Bảo hành nếu là yêu cầu bảo hành */}
                      {isWarranty && (
                        <div style={{ background: '#ffe4e6', color: '#be123c', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #fecdd3' }}>
                          <span>🛡️</span>
                          <span>ĐƠN BẢO HÀNH CHÍNH HÃNG HOMEFIX</span>
                        </div>
                      )}

                      {/* Badge loại đơn: Cần gấp vs Hẹn trước */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        {isImmediate ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: '#fef2f2',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              letterSpacing: '0.02em',
                            }}
                          >
                            ⚡ CẦN GẤP (30-60 PHÚT)
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            📅 HẸN LỊCH TRƯỚC
                          </span>
                        )}

                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px' }}>
                          {formatBookingCode(job)}
                        </span>
                      </div>

                      {/* Tên dịch vụ & danh mục */}
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                        {job.services?.name || 'Dịch vụ sửa chữa'}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '14px' }}>
                        Chuyên mục: <strong>{job.services?.category || 'Sửa chữa'}</strong>
                      </div>

                      {/* Thông tin chi tiết */}
                      <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>📍</span>
                          <div>
                            <strong style={{ color: '#334155', display: 'block' }}>Địa chỉ khách:</strong>
                            <span style={{ color: '#0f172a' }}>{job.address}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>⏰</span>
                          <div>
                            <strong style={{ color: '#334155', display: 'block' }}>Thời gian thực hiện:</strong>
                            <span style={{ color: isImmediate ? '#dc2626' : '#2563eb', fontWeight: 650 }}>
                              {isImmediate ? '⚡ Có mặt ngay (30-60 phút)' : formatDateTime(job.scheduled_at)}
                            </span>
                          </div>
                        </div>

                        {job.description && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '6px' }}>
                            <span style={{ fontSize: '1rem' }}>📝</span>
                            <span style={{ color: '#64748b', fontStyle: 'italic' }}>"{job.description}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Giá tiền & Nút nhận việc */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Thu nhập dự kiến:</span>
                        <strong style={{ fontSize: '1.2rem', color: '#16a34a' }}>
                          {formatVnd(job.total_price)}
                        </strong>
                      </div>

                      <button
                        type="button"
                        disabled={!isVerified || busy}
                        className="hf-button small"
                        style={{
                          background: isVerified ? '#16a34a' : '#94a3b8',
                          borderColor: isVerified ? '#16a34a' : '#94a3b8',
                          color: '#ffffff',
                          fontWeight: 700,
                          padding: '8px 18px',
                          cursor: isVerified ? 'pointer' : 'not-allowed',
                        }}
                        onClick={() => handleClaim(job)}
                        title={!isVerified ? 'Cần duyệt KYC trước khi nhận đơn' : 'Bấm để nhận việc'}
                      >
                        ⚡ Nhận việc ngay
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 2: CÔNG VIỆC CỦA TÔI ==================== */}
      {activeTab === 'my-jobs' && (
        <div>
          {/* Bộ lọc nhỏ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`hf-button small ${myJobsFilter === '' ? '' : 'secondary'}`}
                onClick={() => setMyJobsFilter('')}
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              >
                Tất cả ({myJobs.length})
              </button>
              <button
                type="button"
                className={`hf-button small ${myJobsFilter === 'active' ? '' : 'secondary'}`}
                onClick={() => setMyJobsFilter('active')}
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              >
                Đang thực hiện ({myJobs.filter((j) => ['confirmed', 'in_progress', 'warranty_claim'].includes(j.status)).length})
              </button>
              <button
                type="button"
                className={`hf-button small ${myJobsFilter === 'completed' ? '' : 'secondary'}`}
                onClick={() => setMyJobsFilter('completed')}
                style={{ padding: '4px 12px', fontSize: '0.8rem' }}
              >
                Đã xong ({myJobs.filter((j) => j.status === 'completed').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏳</div>
              Đang tải danh sách công việc của bạn...
            </div>
          ) : filteredMyJobs.length === 0 ? (
            <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔧</div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 700, margin: '0 0 6px' }}>
                Bạn chưa có công việc nào trong mục này
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 18px' }}>
                Hãy qua tab <strong>"Sàn việc mới"</strong> để tìm và nhận đơn sửa chữa ngay hôm nay!
              </p>
              <button className="hf-button small" style={{ background: '#d97706', borderColor: '#d97706' }} onClick={() => setActiveTab('available')}>
                ⚡ Xem các việc mới đang chờ nhận →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredMyJobs.map((job) => {
                const statusMeta = STATUS_LABELS[job.status] || { label: job.status, bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' };
                const isConfirmed = job.status === 'confirmed';
                const isInProgress = job.status === 'in_progress';
                const isCompleted = job.status === 'completed';

                return (
                  <div
                    key={job.id}
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      border: '1.5px solid #e2e8f0',
                      padding: '20px 24px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    {/* Header đơn */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', background: '#f1f5f9', padding: '3px 10px', borderRadius: '6px' }}>
                          MÃ ĐƠN {formatBookingCode(job)}
                        </span>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: '6px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            background: statusMeta.bg,
                            color: statusMeta.color,
                            border: `1px solid ${statusMeta.border}`,
                          }}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        Thời gian tạo: {formatDateTime(job.created_at)}
                      </div>
                    </div>

                    {/* Nội dung dịch vụ & Khách hàng */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                      {/* Cột 1: Dịch vụ & Thu nhập */}
                      <div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                          {job.services?.name || 'Dịch vụ sửa chữa'}
                        </h4>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                          Chuyên mục: <strong>{job.services?.category || 'Sửa chữa'}</strong>
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16a34a' }}>
                          Thu nhập: {formatVnd(job.total_price)}
                        </div>
                        {job.warranty_until && (
                          <div style={{ fontSize: '0.8rem', color: '#2563eb', marginTop: '4px', fontWeight: 600 }}>
                            🛡️ Bảo hành đến ngày: {job.warranty_until}
                          </div>
                        )}
                      </div>

                      {/* Cột 2: Thông tin khách hàng & Địa chỉ */}
                      <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                        <div>
                          <strong style={{ color: '#475569' }}>Khách hàng: </strong>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{job.customer?.full_name || 'Khách hàng'}</span>
                        </div>

                        {job.customer?.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ color: '#475569' }}>Số điện thoại: </strong>
                            <a
                              href={`tel:${job.customer.phone}`}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, textDecoration: 'none', border: '1px solid #bbf7d0' }}
                            >
                              📞 {job.customer.phone} (Bấm gọi ngay)
                            </a>
                          </div>
                        )}

                        <div>
                          <strong style={{ color: '#475569' }}>Địa chỉ sửa chữa: </strong>
                          <span style={{ color: '#0f172a' }}>{job.address}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'inline-block', marginLeft: '6px', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}
                          >
                            📍 Chỉ đường Maps ↗
                          </a>
                        </div>

                        {job.description && (
                          <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '6px', color: '#64748b', fontStyle: 'italic' }}>
                            Ghi chú: "{job.description}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer thanh tác vụ tiến độ */}
                    {(isConfirmed || isInProgress) && (
                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '14px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                        {isConfirmed && (
                          <button
                            type="button"
                            disabled={busy}
                            className="hf-button small"
                            style={{ background: '#2563eb', borderColor: '#2563eb', color: '#ffffff', fontWeight: 700, padding: '8px 18px' }}
                            onClick={() => handleUpdateStatus(job, 'in_progress')}
                          >
                            🚗 Đã tới nơi & Bắt đầu sửa chữa
                          </button>
                        )}

                        {isInProgress && (
                          <button
                            type="button"
                            disabled={busy}
                            className="hf-button small"
                            style={{ background: '#16a34a', borderColor: '#16a34a', color: '#ffffff', fontWeight: 700, padding: '8px 20px' }}
                            onClick={() => handleUpdateStatus(job, 'completed')}
                          >
                            ✅ Hoàn thành sửa chữa
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal xác nhận trên màn hình */}
      {confirmDialog && (
        <ConfirmModal
          dialog={confirmDialog}
          busy={busy}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

function ConfirmModal({ dialog, onClose, busy }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el && !el.open) {
      el.showModal();
    }
    return () => {
      if (el?.open) el.close();
    };
  }, []);

  if (!dialog) return null;

  return (
    <dialog
      ref={ref}
      className="hf-modal confirm-dialog"
      style={{
        maxWidth: '480px',
        padding: '24px 26px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
        zIndex: 100050,
      }}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: dialog.confirmColor ? `${dialog.confirmColor}15` : '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.35rem',
            flexShrink: 0,
          }}
        >
          {dialog.icon || 'ℹ️'}
        </div>
        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
          {dialog.title}
        </h3>
      </div>

      <div style={{ margin: '0 0 22px 0', fontSize: '0.94rem', color: '#475569', lineHeight: 1.6 }}>
        {dialog.message}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button
          type="button"
          className="hf-button secondary small"
          disabled={busy}
          onClick={onClose}
        >
          {dialog.cancelText || 'Hủy bỏ'}
        </button>
        <button
          type="button"
          className="hf-button small"
          disabled={busy}
          style={{
            background: dialog.confirmColor || '#16a34a',
            borderColor: dialog.confirmColor || '#16a34a',
            color: '#ffffff',
            fontWeight: 700,
          }}
          onClick={async () => {
            const onConfirm = dialog.onConfirm;
            onClose();
            if (onConfirm) await onConfirm();
          }}
        >
          {busy ? 'Đang xử lý…' : dialog.confirmText || 'Xác nhận'}
        </button>
      </div>
    </dialog>
  );
}
