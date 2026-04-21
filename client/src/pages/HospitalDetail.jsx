import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { hospitalAPI, appointmentAPI } from '../api';
import { FiMapPin, FiPhone, FiMail, FiGlobe, FiArrowLeft, FiClock, FiHeart, FiCalendar } from 'react-icons/fi';
import { FaHospitalAlt, FaAmbulance, FaBed, FaStethoscope } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const API_BASE = 'http://localhost:5000';
const getImageSrc = (url) => url?.startsWith('http') ? url : `${API_BASE}${url}`;

export default function HospitalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHospital();
  }, [id]);

  const fetchHospital = async () => {
    try {
      const res = await hospitalAPI.getById(id);
      setHospital(res.data);
    } catch (err) {
      console.error('Failed to fetch hospital:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"><div className="spinner"></div></div></div>;
  if (!hospital) return <div className="page-container"><div className="empty-state"><p className="empty-state-text">Hospital not found.</p></div></div>;

  return (
    <div className="page-container fade-in">
      <Link to="/hospitals" className="btn btn-secondary btn-sm" style={{ marginBottom: '1.5rem' }}>
        <FiArrowLeft /> Back to Hospitals
      </Link>

      <div className="row g-4">
        <div className="col-12 col-lg-8 hospital-detail-main">
          {/* Header */}
          <div className="card">
            <div className="detail-header">
              <div className="detail-header-icon" style={{ overflow: 'hidden', padding: hospital.imageUrl ? 0 : 'auto' }}>
                {hospital.imageUrl ? (
                  <img src={getImageSrc(hospital.imageUrl)} alt={hospital.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <FaHospitalAlt />
                )}
              </div>
              <div>
                <h1 className="detail-title">{hospital.name}</h1>
                <div className="detail-address">
                  <FiMapPin /> {hospital.address}, {hospital.city}, {hospital.state}
                </div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {hospital.verified && <span className="badge badge-success">✓ Verified</span>}
                  {hospital.emergency && <span className="badge badge-danger"><FaAmbulance /> 24/7 Emergency</span>}
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          {hospital.description && (
            <div className="card">
              <h3 className="detail-section-title"><FiHeart /> About</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>{hospital.description}</p>
            </div>
          )}

          {/* Specialties */}
          {hospital.specialties?.length > 0 && (
            <div className="card">
              <h3 className="detail-section-title"><FaStethoscope /> Specialties</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {hospital.specialties.map((s, i) => (
                  <span key={i} className="badge badge-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div className="card">
            <h3 className="detail-section-title"><FiClock /> Hospital Information</h3>
            <div className="row g-3">
              <div className="col-12 col-md-6 detail-info-item">
                <span className="detail-info-label">Total Beds</span>
                <span className="detail-info-value"><FaBed style={{ marginRight: 4 }} />{hospital.beds}</span>
              </div>
              <div className="col-12 col-md-6 detail-info-item">
                <span className="detail-info-label">Emergency</span>
                <span className="detail-info-value">{hospital.emergency ? '✅ Available' : '❌ Not Available'}</span>
              </div>
              {hospital.phone && (
                <div className="col-12 col-md-6 detail-info-item">
                  <span className="detail-info-label">Phone</span>
                  <span className="detail-info-value"><FiPhone style={{ marginRight: 4 }} />{hospital.phone}</span>
                </div>
              )}
              {hospital.email && (
                <div className="col-12 col-md-6 detail-info-item">
                  <span className="detail-info-label">Email</span>
                  <span className="detail-info-value"><FiMail style={{ marginRight: 4 }} />{hospital.email}</span>
                </div>
              )}
              {hospital.website && (
                <div className="col-12 col-md-6 detail-info-item">
                  <span className="detail-info-label">Website</span>
                  <span className="detail-info-value">
                    <a href={hospital.website} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', textDecoration: 'none' }}>
                      <FiGlobe style={{ marginRight: 4 }} />{hospital.website}
                    </a>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Actions & Contact */}
        <div className="col-12 col-lg-4 hospital-detail-sidebar">
          <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              <FiMapPin style={{ marginRight: 4 }} /> {hospital.address}, {hospital.city}, {hospital.state}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
              target="_blank" rel="noreferrer"
              className="btn btn-primary btn-sm" style={{ width: '100%' }}
            >
              Get Directions
            </a>
          </div>

          {/* Appointment Booking */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 className="detail-section-title"><FiCalendar /> Book Appointment</h3>
            {!isAuthenticated ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Please login to book an appointment with this hospital.
                </p>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
                  Login to Book
                </button>
              </div>
            ) : user?.role === 'PATIENT' ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Ready to schedule a visit?
                </p>
                <button 
                  className="btn btn-success" 
                  style={{ width: '100%', fontSize: '1.1rem', padding: '0.75rem' }} 
                  onClick={() => navigate(`/hospitals/${id}/book`)}
                >
                  Book Appointment Now
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Only patients can book appointments.</p>
            )}
          </div>

          {/* Contact Card */}
          {hospital.phone && (
            <div className="card">
              <h3 className="detail-section-title"><FiPhone /> Quick Contact</h3>
              <a href={`tel:${hospital.phone}`} className="btn btn-success" style={{ width: '100%', marginBottom: '0.5rem' }}>
                <FiPhone /> Call Hospital
              </a>
              {hospital.email && (
                <a href={`mailto:${hospital.email}`} className="btn btn-secondary" style={{ width: '100%' }}>
                  <FiMail /> Send Email
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
