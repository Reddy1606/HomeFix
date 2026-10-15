import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/auth';

const sample = [
 {id:'HF-1001', service:'Sửa máy lạnh', date:'2026-10-18', status:'Đang xử lý', address:'Quận 8, TP.HCM'},
 {id:'HF-1002', service:'Sửa điện nước', date:'2026-10-09', status:'Hoàn thành', address:'Quận 7, TP.HCM'},
];
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';
export default function BookingHistory(){
 const {user}=useAuth();
 const [items, setItems] = useState(() => {
   if (!useMock) return [];

   try {
     const saved = JSON.parse(
       localStorage.getItem("homefix_bookings") || "[]"
     );

     return [
       ...saved,
       ...sample
     ];
   } catch {
     return sample;
   }
 });
 const [error,setError]=useState('');
 const [selected,setSelected]=useState(null);
 useEffect(()=>{if(useMock)return; let active=true;
 apiClient.get('/bookings').then(({data})=>{if(active)setItems(Array.isArray(data?.data?.bookings)?data.data.bookings:Array.isArray(data?.data)?data.data:[]);}).catch(()=>{if(active)setError('Không tải được lịch sử đặt lịch. Backend cần cung cấp GET /api/bookings.');});
 return ()=>{active=false};},[]);
 return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
 <h1 className="text-3xl font-bold text-gray-900">Lịch sử đặt lịch</h1>
 <p className="mt-2 text-gray-600">Các yêu cầu sửa chữa của {user?.fullName || user?.name || 'bạn'}.</p>
 {useMock && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-900">Chế độ demo: đây là dữ liệu mẫu, không phải đơn hàng thật.</p>}
 {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
 <div className="mt-7 space-y-4">{items.length===0 && !error && <p>Bạn chưa có lịch đặt sửa chữa nào.</p>}
 {items.map((item,i)=><article key={item.id || i} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
 <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{item.service?.name || item.serviceName || item.service || 'Dịch vụ sửa chữa'}</h2><span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{item.status || 'Chờ xác nhận'}</span></div>
 <p className="mt-2 text-sm text-gray-600">Mã đơn: {item.id || item.booking_id} · Ngày: {item.date || item.booking_date || item.scheduled_at || 'Chưa xác định'}</p>
 <p className="mt-1 text-sm text-gray-600">Địa chỉ: {item.address || 'Chưa cập nhật'}</p>
 <button type="button" onClick={()=>setSelected(selected===i?null:i)} className="mt-3 text-sm font-semibold text-blue-700">{selected===i?'Ẩn trạng thái':'Theo dõi trạng thái'}</button>
 <div className="mt-3">
  <Link
    to={`/my-bookings/${item.id || item.booking_id}`}
    className="text-sm font-semibold text-orange-600 hover:underline"
  >
    Xem chi tiết đơn →
  </Link>
</div>
 {selected===i && <div className="mt-3 rounded-lg bg-gray-50 p-4"><p className="font-semibold">Trạng thái hiện tại: {item.status || 'Chờ xác nhận'}</p><p className="mt-1 text-sm text-gray-600">Thông tin sẽ được cập nhật khi Backend quản lý đơn được kết nối.</p></div>}
 </article>)}</div></main>;
}
