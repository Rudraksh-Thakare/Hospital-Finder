import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLogOut } from 'react-icons/fi';
import { FaHospitalAlt } from 'react-icons/fa';

export default function Navbar() {
  const { user, isAuthenticated, logout, isAdmin, isHospital } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitial = (name) => name?.charAt(0)?.toUpperCase() || '?';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <div className="brand-icon"><FaHospitalAlt /></div>
        HospitalFinder
      </Link>

      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/hospitals" className="nav-link">Hospitals</Link>

        {isAuthenticated ? (
          <>
            {user?.role === 'PATIENT' && <Link to="/my-appointments" className="nav-link">My Appointments</Link>}
            {isAdmin && <Link to="/admin" className="nav-link">Admin Panel</Link>}
            {isHospital && <Link to="/hospital/dashboard" className="nav-link">My Hospital</Link>}

            <div className="nav-user">
              <div className="nav-user-info">
                <div className="nav-user-name">{user?.name}</div>
                <div className="nav-user-role">{user?.role}</div>
              </div>
              <div className="nav-avatar">{getInitial(user?.name)}</div>
              <button className="btn btn-sm btn-secondary" onClick={handleLogout} title="Logout">
                <FiLogOut />
              </button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
