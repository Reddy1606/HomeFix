import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BOOKING_STATUS, money } from '../../utils/admin';

const colors = ['#e5a11b', '#2563eb', '#8b5cf6', '#15956b', '#e15a64', '#d46b16'];
const compact = (value) => new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);

export default function DashboardCharts({ data }) {
  const [range, setRange] = useState(6);
  const [today] = useState(() => new Date());
  const current = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit' }).formatToParts(today);
  const year = Number(current.find((p) => p.type === 'year').value);
  const month = Number(current.find((p) => p.type === 'month').value);
  const series = Array.from({ length: range }, (_, index) => {
    const date = new Date(Date.UTC(year, month - range + index, 1));
    const key = date.toISOString().slice(0, 7);
    return data.revenueSeries.find((row) => row.month === key) || { month: key, revenue: 0, commission: 0 };
  });
  const max = Math.max(...series.map((row) => row.revenue), 1);
  const total = series.reduce((sum, row) => sum + row.revenue, 0);
  const entries = Object.entries(data.statusCounts);
  let offset = 0;
  const segments = entries.map(([, count], index) => {
    const start = offset;
    offset += data.total_bookings ? count / data.total_bookings * 100 : 0;
    return `${colors[index % colors.length]} ${start}% ${offset}%`;
  });
  return (
    <div className="analytics-grid">
      <section className="hf-card chart-card" aria-labelledby="revenue-chart-title">
        <div className="chart-heading">
          <div><span className="hf-eyebrow">DOANH SỐ & HOA HỒNG</span><h2 id="revenue-chart-title">Giá trị đơn hoàn thành</h2></div>
          <label className="admin-select-label">Khoảng hiển thị
            <select value={range} onChange={(event) => setRange(Number(event.target.value))}>
              <option value={6}>6 tháng gần nhất</option><option value={12}>12 tháng gần nhất</option>
            </select>
          </label>
        </div>
        <p className="hf-muted">Tổng trong khoảng: <strong>{money(total)}</strong></p>
        <p className="hf-hint">Theo tháng tạo đơn (giờ Việt Nam), chỉ tính đơn hiện ở trạng thái hoàn thành. Hoa hồng 15% là ước tính, chưa phải khoản đã thu.</p>
        <div className="chart-legend"><span><i style={{ background: '#2563eb' }} />Giá trị đơn</span><span><i style={{ background: '#e99135' }} />Hoa hồng 15%</span></div>
        {total === 0 && <p className="chart-empty" role="status">Chưa có doanh số từ đơn hoàn thành trong khoảng này.</p>}
        <div className="revenue-bars" role="img" aria-label={`Biểu đồ giá trị đơn hoàn thành ${range} tháng, tổng ${money(total)}. Số liệu chi tiết ở bảng bên dưới.`}>
          {series.map((row) => <div className="revenue-row" key={row.month}>
            <span className="revenue-month">{row.month.slice(5)}/{row.month.slice(0, 4)}</span>
            <div className="revenue-tracks" title={`${money(row.revenue)}; hoa hồng ${money(row.commission)}`}>
              <span className="revenue-track"><i style={{ width: `${row.revenue / max * 100}%` }} /></span>
              <span className="revenue-track commission"><i style={{ width: `${row.commission / max * 100}%` }} /></span>
            </div>
            <span className="revenue-value">{compact(row.revenue)} ₫</span>
          </div>)}
        </div>
        <details className="chart-data"><summary>Xem bảng số liệu</summary>
          <div className="hf-table-wrap"><table className="hf-table"><caption>Giá trị theo tháng tạo đơn, đơn vị VND</caption>
            <thead><tr><th scope="col">Tháng</th><th scope="col">Giá trị đơn</th><th scope="col">Hoa hồng ước tính</th></tr></thead>
            <tbody>{series.map((row) => <tr key={row.month}><td>{row.month}</td><td>{money(row.revenue)}</td><td>{money(row.commission)}</td></tr>)}</tbody>
          </table></div>
        </details>
      </section>
      <section className="hf-card chart-card" aria-labelledby="status-chart-title">
        <span className="hf-eyebrow">TIẾN ĐỘ XỬ LÝ</span><h2 id="status-chart-title">Tỷ lệ trạng thái đơn</h2>
        <p className="hf-muted">Toàn bộ {data.total_bookings} đơn hàng</p>
        <div className="status-donut" style={{ background: data.total_bookings ? `conic-gradient(${segments.join(',')})` : '#e2e8f0' }}
          role="img" aria-label={data.total_bookings ? 'Biểu đồ tỷ lệ trạng thái đơn. Số lượng và phần trăm được liệt kê bên dưới.' : 'Chưa có đơn hàng để thống kê.'}>
          <span><strong>{data.total_bookings}</strong><small>đơn hàng</small></span>
        </div>
        <ul className="status-chart-legend">{entries.map(([status, count], index) => <li key={status}>
          <Link to={`/admin/bookings?status=${encodeURIComponent(status)}`}>
            <span><i style={{ background: colors[index % colors.length] }} />{BOOKING_STATUS[status] || status}</span>
            <strong>{count} <small>({data.total_bookings ? (count / data.total_bookings * 100).toFixed(1) : '0'}%)</small></strong>
          </Link>
        </li>)}</ul>
      </section>
    </div>
  );
}
