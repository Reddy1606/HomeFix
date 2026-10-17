import { Link } from 'react-router-dom';
import { loadDashboard } from '../../api/adminData';
import DashboardCharts from '../../components/admin/DashboardCharts';
import useAdminResource from '../../hooks/useAdminResource';
import { ResourceState, StatusBadge } from '../../components/admin/AdminUI';
import { dateLabel, money } from '../../utils/admin';

export default function Dashboard() {
  const resource = useAdminResource(loadDashboard);
  const data = resource.data;
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <span className="hf-eyebrow">HOẠT ĐỘNG HOMEFIX</span>
          <h1>Tổng quan</h1>
          <p>Theo dõi đơn hàng và dịch vụ trên nền tảng.</p>
        </div>
        <button
          className="hf-button secondary"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          ↻ Làm mới
        </button>
      </div>
      <ResourceState {...resource} />
      {data && (
        <>
          <div className="stats-grid">
            {[
              {
                label: 'Tổng số đơn',
                value: data.total_bookings,
                icon: '▤',
                tone: 'blue',
              },
              {
                label: 'Chờ xử lý',
                value: data.pending_bookings,
                icon: '◷',
                tone: 'orange',
              },
              {
                label: 'Đã hoàn thành',
                value: data.completed_bookings,
                icon: '✓',
                tone: 'green',
              },
              {
                label: 'Tổng số dịch vụ',
                value: data.total_services,
                icon: '◇',
                tone: 'purple',
              },
            ].map((stat) => (
              <article className="hf-card stat-card" key={stat.label}>
                <div>
                  <p>{stat.label}</p>
                  <strong>{stat.value ?? '—'}</strong>
                </div>
                <span className={`stat-icon ${stat.tone}`} aria-hidden="true">
                  {stat.icon}
                </span>
              </article>
            ))}
          </div>
          <div className="revenue-totals">
            <article className="hf-card"><span>Giá trị đơn hoàn thành · toàn thời gian</span><strong>{money(data.revenue)}</strong></article>
            <article className="hf-card"><span>Hoa hồng 15% ước tính · toàn thời gian</span><strong>{money(data.commission)}</strong></article>
          </div>
          <DashboardCharts data={data} />
          <div className="dashboard-recent">
            <section className="hf-card">
              <div className="card-heading">
                <h2>Đơn hàng gần đây</h2>
                <Link to="/admin/bookings">Xem tất cả →</Link>
              </div>
              {data.recent_bookings?.length ? (
                <div className="hf-table-wrap">
                  <table className="hf-table">
                    <thead>
                      <tr>
                        <th scope="col">Khách hàng / Dịch vụ</th>
                        <th scope="col">Ngày đặt</th>
                        <th scope="col">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td>
                            <strong>
                              {booking.contact_name ||
                                booking.customer?.full_name ||
                                'Khách hàng'}
                            </strong>
                            <span className="table-subtitle">
                              {booking.services?.name || 'Dịch vụ sửa chữa'}
                            </span>
                          </td>
                          <td>{dateLabel(booking.created_at)}</td>
                          <td>
                            <StatusBadge status={booking.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="resource-state">Chưa có đơn hàng gần đây.</div>
              )}
            </section>
          </div>
          <div className="admin-callout">
            <div>
              <h2>Dịch vụ rõ ràng, khách hàng an tâm.</h2>
              <p>
                Cập nhật bảng giá và thông tin bảo hành để khách hàng dễ dàng
                lựa chọn.
              </p>
            </div>
            <Link className="hf-button" to="/admin/services">
              Quản lý dịch vụ →
            </Link>
          </div>
        </>
      )}
    </>
  );
}
