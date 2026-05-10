import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Protected from './components/Protected.jsx';
import HomePage from './pages/HomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ReservationPage from './pages/ReservationPage.jsx';
import PaymentPage from './pages/PaymentPage.jsx';
import ActiveBookingPage from './pages/ActiveBookingPage.jsx';
import MyBookingsPage from './pages/MyBookingsPage.jsx';
import MyReportsPage from './pages/MyReportsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminProtected from './components/AdminProtected.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import AdminZonesPage from './pages/AdminZonesPage.jsx';
import AdminDisabilityPage from './pages/AdminDisabilityPage.jsx';
import AdminReservationsPage from './pages/AdminReservationsPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import AdminViolationsPage from './pages/AdminViolationsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Navigate to="/auth" replace />} />
      <Route
        path="/admin"
        element={
          <AdminProtected>
            <AdminLayout />
          </AdminProtected>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="zones" element={<AdminZonesPage />} />
        <Route path="map" element={<Navigate to="/admin/zones" replace />} />
        <Route path="disability" element={<AdminDisabilityPage />} />
        <Route path="reservations" element={<AdminReservationsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="violations" element={<AdminViolationsPage />} />
      </Route>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="auth" element={<AuthPage />} />
        <Route
          path="reservation"
          element={
            <Protected>
              <ReservationPage />
            </Protected>
          }
        />
        <Route
          path="payment"
          element={
            <Protected>
              <PaymentPage />
            </Protected>
          }
        />
        <Route
          path="booking"
          element={
            <Protected>
              <ActiveBookingPage />
            </Protected>
          }
        />
        <Route
          path="my-bookings"
          element={
            <Protected>
              <MyBookingsPage />
            </Protected>
          }
        />
        <Route
          path="my-reports"
          element={
            <Protected>
              <MyReportsPage />
            </Protected>
          }
        />
        <Route
          path="notifications"
          element={
            <Protected>
              <NotificationsPage />
            </Protected>
          }
        />
        <Route
          path="dashboard"
          element={
            <Protected>
              <DashboardPage />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
