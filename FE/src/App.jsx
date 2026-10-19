import BookingPage from "./pages/BookingPage";
import BookingDetail from './pages/customer/BookingDetail';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import PlaceholderPage from './pages/PlaceholderPage';
import NotFound from './pages/NotFound';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthPage from './pages/auth/AuthPage';
import Profile from './pages/auth/Profile';
import BookingHistory from './pages/customer/BookingHistory';
import TechnicianJobs from './pages/technician/Jobs';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Bookings from './pages/admin/Bookings';
import AdminServices from './pages/admin/Services';
import AdminUsers from './pages/admin/Users';
import AdminPackages from './pages/admin/Packages';
import Packages from './pages/Packages';
import PackageCheckout from './pages/PackageCheckout';
import './styles/account.css';
import './styles/analytics.css';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<ServiceDetail />} />
            <Route path="/packages" element={<Packages />} />
            <Route path="/packages/checkout" element={<PackageCheckout />} />

            {/* FE2 sẽ thay route đặt lịch bằng màn hình của nhóm. */}
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/login" element={<AuthPage key="login" />} />
            <Route
              path="/register"
              element={<AuthPage key="register" mode="register" />}
            />
            <Route
              path="/register-technician"
              element={<AuthPage key="register-tech" mode="register-technician" />}
            />
            <Route
              path="/forgot-password"
              element={<AuthPage key="forgot-password" mode="forgot-password" />}
            />
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/my-bookings" element={<BookingHistory />} />
              <Route path="/my-bookings/:id" element={<BookingDetail />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['technician']} />}>
              <Route path="/technician/jobs" element={<TechnicianJobs />} />
            </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="packages" element={<AdminPackages />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Route>
      </Routes>
    </ToastProvider>
  </AuthProvider>
);
}
