import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import HospitalList from './pages/HospitalList';
import HospitalDetail from './pages/HospitalDetail';
import BookAppointment from './pages/BookAppointment';
import HospitalDashboard from './pages/HospitalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PatientDashboard from './pages/PatientDashboard';
import './index.css';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      <Route path="/hospitals" element={<HospitalList />} />
      <Route path="/hospitals/:id" element={<HospitalDetail />} />
      <Route path="/hospitals/:id/book" element={
        <ProtectedRoute roles={['PATIENT']}>
          <BookAppointment />
        </ProtectedRoute>
      } />
      <Route path="/hospital/dashboard" element={
        <ProtectedRoute roles={['HOSPITAL']}>
          <HospitalDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute roles={['ADMIN']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/my-appointments" element={
        <ProtectedRoute roles={['PATIENT']}>
          <PatientDashboard />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}
