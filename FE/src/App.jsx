import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import PlaceholderPage from './pages/PlaceholderPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />

        {/* Các route dưới đây thuộc phạm vi Frontend 2 / Frontend 3,
            tạm hiển thị trang chờ để không bị lỗi khi điều hướng */}
        <Route
          path="/booking"
          element={
            <PlaceholderPage
              title="Đặt lịch sửa chữa"
              description="Chức năng đặt lịch đang được Frontend 2 phát triển."
            />
          }
        />
        <Route
          path="/login"
          element={
            <PlaceholderPage
              title="Đăng nhập"
              description="Chức năng tài khoản đang được Frontend 3 phát triển."
            />
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
