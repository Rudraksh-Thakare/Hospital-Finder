import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { appointmentAPI } from '../api';
import { FiCalendar, FiClock, FiMapPin, FiActivity } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await appointmentAPI.getMyAppointments();
      setAppointments(res.data);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'badge-success';
      case 'PENDING': return 'badge-primary'; // yellow/orange might be better, using primary for now
      case 'CANCELLED': return 'badge-danger';
      case 'COMPLETED': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"><div className="spinner"></div></div></div>;

  return (
    <div className="page-container fade-in">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <h1 className="dashboard-title">My Appointments</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome back, {user?.name}</p>
      </div>

      {appointments.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <FiCalendar size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
          <h3>No appointments found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You haven't booked any appointments yet.</p>
          <Link to="/hospitals" className="btn btn-primary">Find a Hospital</Link>
        </div>
      ) : (
        <div className="row g-4">
          {appointments.map((apt) => (
            <div key={apt.id} className="col-12 col-md-6 col-lg-4">
              <div className="card h-100" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                    <Link to={`/hospitals/${apt.hospitalId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {apt.hospitalName}
                    </Link>
                  </h3>
                  <span className={`badge ${getStatusBadgeClass(apt.status)}`}>{apt.status}</span>
                </div>
                
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', flex: 1 }}>
                  {apt.patientName && (
                    <div style={{ marginBottom: '0.75rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      Patient: {apt.patientName}
                    </div>
                  )}
                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiMapPin /> {apt.hospitalCity}
                  </div>
                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiCalendar /> {new Date(apt.appointmentDate).toLocaleDateString()}
                  </div>
                  <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiClock /> {apt.appointmentTime}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
