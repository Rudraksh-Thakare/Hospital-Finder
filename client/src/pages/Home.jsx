import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiArrowRight, FiShield, FiMapPin, FiHeart } from 'react-icons/fi';
import { FaHospitalAlt, FaAmbulance } from 'react-icons/fa';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <FaHospitalAlt /> The #1 Verified Healthcare Platform
          </div>
          <h1>
            Discover the Best <br />
            <span className="gradient-text">Hospitals Near You</span>
          </h1>
          <p>
            Experience seamless access to top-rated healthcare facilities. Real-time availability, emergency integration, and instant directions powered by advanced mapping technology.
          </p>
          <div className="hero-actions">
            <Link to="/hospitals" className="btn btn-primary btn-lg">
              <FiSearch style={{ fontSize: '1.2em' }} /> Search Hospitals
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-outline btn-lg">
                Create Account <FiArrowRight />
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="page-container" style={{ position: 'relative', zIndex: 5, paddingBottom: '6rem' }}>
        <div className="row g-4 justify-content-center">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon purple"><FiMapPin /></div>
              <div>
                <div className="stat-value">500+</div>
                <div className="stat-label">Hospitals Listed</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon cyan"><FiSearch /></div>
              <div>
                <div className="stat-value">24/7</div>
                <div className="stat-label">Instant Search</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon green"><FiShield /></div>
              <div>
                <div className="stat-value">100%</div>
                <div className="stat-label">Verified Data</div>
              </div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card">
              <div className="stat-icon orange"><FaAmbulance /></div>
              <div>
                <div className="stat-value">Fast</div>
                <div className="stat-label">Emergency Access</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
