import { useState, useEffect } from 'react';
import { fetchPackages, fetchAdminSubscriptions } from '../../api/packages';
import { formatPrice } from '../../api/services';

export default function AdminPackages() {
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'subscriptions' | 'packages'
  const [packages, setPackages] = useState([]);
  const [subsData, setSubsData] = useState({ subscriptions: [], stats: null, total: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pkgs, subs] = await Promise.all([
        fetchPackages(),
        fetchAdminSubscriptions(statusFilter ? { status: statusFilter } : {}),
      ]);
      setPackages(pkgs || []);
      setSubsData(subs || { subscriptions: [], stats: null, total: 0 });
    } catch (err) {
      console.error('Lỗi tải dữ liệu gói admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const stats = subsData?.stats || {
    total_subscriptions: 0,
    active_subscribers: 0,
    total_package_revenue: 0,
    estimated_mrr: 0,
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '---';
    try {
      return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(isoStr));
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADING */}
      <div className="admin-page-heading">
        <div>
          <span className="hf-eyebrow">DOANH THU ĐỊNH KỲ (MRR) & KHÁCH HÀNG THÂN THIẾT</span>
          <h1>Quản lý Gói dịch vụ & Thuê bao</h1>
          <p>Theo dõi các gói bảo dưỡng định kỳ 1 năm, bảo hành và danh sách khách hàng VIP.</p>
        </div>
        <button className="hf-button secondary" onClick={loadData} disabled={loading}>
          ↻ Làm mới
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="hf-card p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Khách hàng VIP Đang hoạt động
          </div>
          <div className="mt-2 text-3xl font-black text-amber-600">
            {stats.active_subscribers} <span className="text-sm font-semibold text-gray-400">hội viên</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Được ưu tiên nhận đơn sớm nhất</p>
        </div>

        <div className="hf-card p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Doanh thu Gói trả trước
          </div>
          <div className="mt-2 text-3xl font-black text-emerald-600">
            {formatPrice(stats.total_package_revenue)}
          </div>
          <p className="mt-1 text-xs text-gray-500">Tổng thu upfront từ bán gói</p>
        </div>

        <div className="hf-card p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            MRR Định kỳ ước tính
          </div>
          <div className="mt-2 text-3xl font-black text-brand-600">
            {formatPrice(stats.estimated_mrr)} <span className="text-sm font-semibold text-gray-400">/tháng</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Chỉ số tài chính trọng tâm EXE101</p>
        </div>

        <div className="hf-card p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Tổng lượt mua gói
          </div>
          <div className="mt-2 text-3xl font-black text-purple-600">
            {stats.total_subscriptions} <span className="text-sm font-semibold text-gray-400">lượt</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">Bao gồm cả gia hạn và đăng ký mới</p>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-gray-200 gap-4">
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'subscriptions'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 Khách hàng đã đăng ký gói ({subsData?.subscriptions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            activeTab === 'packages'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ⚙️ Cấu hình các gói dịch vụ ({packages.length})
        </button>
      </div>

      {/* TAB 1: DANH SÁCH THUÊ BAO KHÁCH HÀNG */}
      {activeTab === 'subscriptions' && (
        <section className="hf-card">
          <div className="admin-toolbar flex items-center justify-between p-4 border-b border-gray-100">
            <div className="text-sm font-bold text-gray-700">
              Danh sách tài khoản hội viên VIP
            </div>
            <label className="admin-select-label flex items-center gap-2 text-xs">
              Lọc trạng thái:
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs"
              >
                <option value="">Tất cả</option>
                <option value="active">Đang hoạt động (Active)</option>
                <option value="expired">Đã hết hạn</option>
              </select>
            </label>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-500">Đang tải danh sách...</div>
          ) : subsData.subscriptions?.length === 0 ? (
            <div className="py-12 text-center text-gray-400">Chưa có khách hàng nào đăng ký gói.</div>
          ) : (
            <div className="hf-table-wrap">
              <table className="hf-table">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Gói dịch vụ</th>
                    <th>Giá thanh toán</th>
                    <th>Thời hạn</th>
                    <th>Lượt bảo dưỡng</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {subsData.subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <strong>{sub.users?.full_name || 'Khách hàng'}</strong>
                        <div className="table-subtitle">{sub.users?.phone || sub.users?.email || '---'}</div>
                      </td>
                      <td>
                        <div className="font-bold text-brand-700">{sub.package_name}</div>
                        <div className="table-subtitle">Ưu đãi: Giảm {sub.discount_percentage}% công</div>
                      </td>
                      <td>
                        <strong className="text-emerald-700">{formatPrice(sub.price_paid)}</strong>
                        <div className="table-subtitle">Phương thức: {sub.payment_method || 'CK'}</div>
                      </td>
                      <td>
                        <div>{formatDate(sub.start_date)} → <strong>{formatDate(sub.end_date)}</strong></div>
                        <div className="table-subtitle">Bảo hành: {sub.warranty_days} ngày</div>
                      </td>
                      <td>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800">
                          {sub.remaining_quota} / {sub.maintenance_quota} lần
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                            sub.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {sub.status === 'active' ? '● ĐANG DÙNG' : 'HẾT HẠN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: CẤU HÌNH CÁC GÓI */}
      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.id || pkg.code} className="hf-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800">
                    Mã: {pkg.code}
                  </span>
                  <span className="text-xs font-bold text-emerald-600">
                    {pkg.is_active ? '● Hoạt động' : 'Tạm ẩn'}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-black text-gray-900">{pkg.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{pkg.description}</p>

                <div className="mt-4 border-t border-b border-gray-100 py-3">
                  <div className="text-2xl font-black text-brand-700">{formatPrice(pkg.price)}</div>
                  <div className="text-xs text-gray-500">Thời hạn: {pkg.duration_months} tháng</div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-600">
                  <div>❄️ Lượt bảo dưỡng miễn phí: <strong>{pkg.maintenance_quota} lần</strong></div>
                  <div>🛡️ Thời hạn bảo hành: <strong>{pkg.warranty_days} ngày</strong></div>
                  <div>⚡ Mức ưu tiên nhận đơn: <strong>Cấp {pkg.priority_level} (Đơn VIP)</strong></div>
                  <div>🎁 Chiết khấu tiền công: <strong>Giảm {pkg.discount_percentage}%</strong></div>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4 text-xs text-gray-400 text-right">
                ID: {pkg.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
