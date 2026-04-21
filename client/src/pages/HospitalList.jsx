import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hospitalAPI } from '../api';
import { FiSearch, FiMapPin, FiPhone, FiNavigation } from 'react-icons/fi';
import { FaHospitalAlt, FaAmbulance } from 'react-icons/fa';

const API_BASE = 'http://localhost:5000';
const getImageSrc = (url) => url?.startsWith('http') ? url : `${API_BASE}${url}`;

export default function HospitalList() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
        },
        () => console.log('Location access denied, using default.')
      );
    }
  }, []);

  useEffect(() => {
    fetchHospitals();
  }, [search, emergencyOnly, userLocation, specialty]);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (specialty) params.specialty = specialty;
      if (emergencyOnly) params.emergency = 'true';
      if (userLocation) {
        params.lat = userLocation.lat;
        params.lng = userLocation.lng;
        params.radius = 100;
      }
      const res = await hospitalAPI.getAll(params);
      setHospitals(res.data);
    } catch (err) {
      console.error('Failed to fetch hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Find Hospitals</h1>
        <p className="page-subtitle">
          {userLocation
            ? 'Showing hospitals near your location'
            : 'Browse all verified hospitals'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              className="form-input"
              type="text"
              placeholder="Search by name, city, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="search-filters">
            <select 
              className="form-select" 
              style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 1rem', fontSize: '0.85rem' }} 
              value={specialty} 
              onChange={(e) => setSpecialty(e.target.value)}
            >
              <option value="">All Specialties</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Neurology">Neurology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Oncology">Oncology</option>
              <option value="General">General</option>
            </select>
            <button
              className={`btn btn-sm ${emergencyOnly ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setEmergencyOnly(!emergencyOnly)}
            >
              <FaAmbulance /> Emergency
            </button>
            {userLocation && (
              <button className="btn btn-sm btn-secondary" onClick={fetchHospitals}>
                <FiNavigation /> Refresh Near Me
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hospital Cards */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : hospitals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏥</div>
          <p className="empty-state-text">No hospitals found. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="row g-4">
          {hospitals.map((h) => (
            <div className="col-12 col-md-6 col-lg-4" key={h.id}>
              <Link to={`/hospitals/${h.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                <div className="hospital-card h-100">
                  <div className="hospital-card-img" style={{ padding: h.imageUrl ? '0' : 'auto' }}>
                    {h.imageUrl ? (
                      <img src={getImageSrc(h.imageUrl)} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <FaHospitalAlt />
                    )}
                  </div>
                  <div className="hospital-card-body">
                    <h3 className="hospital-card-name">{h.name}</h3>
                    <div className="hospital-card-location">
                      <FiMapPin /> {h.city}, {h.state}
                    </div>
                    <div className="hospital-card-tags">
                      {h.emergency && <span className="badge badge-danger"><FaAmbulance /> Emergency</span>}
                      {h.isGovernment && <span className="badge badge-success">Govt. Hospital</span>}
                      {h.specialties?.slice(0, 3).map((s, i) => (
                        <span key={i} className="badge badge-primary">{s}</span>
                      ))}
                    </div>
                    <div className="hospital-card-meta">
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span>{h.beds} Beds</span>
                        {h.distance !== undefined && (
                          <span className="hospital-card-distance">
                            <FiNavigation /> {h.distance} km
                          </span>
                        )}
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(`https://www.google.com/maps/dir/?api=1&destination=${h.latitude},${h.longitude}`, '_blank');
                        }}
                      >
                        Directions
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
