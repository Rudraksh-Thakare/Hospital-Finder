import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import toast from 'react-hot-toast';
import { FiUsers, FiTrash2, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { FaHospitalAlt, FaUserShield, FaUserInjured } from 'react-icons/fa';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, hospitalsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getHospitals()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setHospitals(hospitalsRes.data);
    } catch (err) {
      toast.error('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(id);
      setUsers(users.filter(u => u.id !== id));
      toast.success('User deleted.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  const handleVerifyHospital = async (id) => {
    try {
      const res = await adminAPI.verifyHospital(id);
      setHospitals(hospitals.map(h => h.id === id ? { ...h, verified: res.data.verified } : h));
      toast.success(res.data.verified ? 'Hospital verified!' : 'Hospital unverified.');
    } catch (err) {
      toast.error('Failed to update verification.');
    }
  };

  const handleDeleteHospital = async (id, name) => {
    if (!window.confirm(`Delete hospital "${name}"? This action cannot be undone.`)) return;
    try {
      await adminAPI.deleteHospital(id);
      setHospitals(hospitals.filter(h => h.id !== id));
      toast.success('Hospital deleted.');
    } catch (err) {
      toast.error('Failed to delete hospital.');
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return <FaUserShield style={{ color: 'var(--primary-light)' }} />;
      case 'HOSPITAL': return <FaHospitalAlt style={{ color: 'var(--accent)' }} />;
      default: return <FaUserInjured style={{ color: 'var(--success)' }} />;
    }
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"><div className="spinner"></div></div></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Manage users, hospitals, and platform operations</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="row g-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card h-100">
              <div className="stat-icon purple"><FiUsers /></div>
              <div><div className="stat-value">{stats.totalUsers}</div><div className="stat-label">Total Users</div></div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card h-100">
              <div className="stat-icon cyan"><FaHospitalAlt /></div>
              <div><div className="stat-value">{stats.totalHospitals}</div><div className="stat-label">Hospitals</div></div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card h-100">
              <div className="stat-icon green"><FaUserInjured /></div>
              <div><div className="stat-value">{stats.totalPatients}</div><div className="stat-label">Patients</div></div>
            </div>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="stat-card h-100">
              <div className="stat-icon orange"><FiAlertCircle /></div>
              <div><div className="stat-value">{stats.pendingVerification}</div><div className="stat-label">Pending Verification</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="auth-tabs" style={{ maxWidth: 360, marginBottom: '1.5rem' }}>
        <button className={`auth-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>All Users</button>
        <button className={`auth-tab ${activeTab === 'hospitals' ? 'active' : ''}`} onClick={() => setActiveTab('hospitals')}>Hospitals</button>
      </div>

      {/* Users Table */}
      {activeTab === 'overview' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : u.role === 'HOSPITAL' ? 'badge-warning' : 'badge-success'}`}>
                        {getRoleIcon(u.role)} {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>
                      {u.role !== 'ADMIN' && (
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteUser(u.id, u.name)} title="Delete">
                          <FiTrash2 />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hospitals Table */}
      {activeTab === 'hospitals' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hospital</th>
                  <th>City</th>
                  <th>Owner</th>
                  <th>Beds</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hospitals.map(h => (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.name}</td>
                    <td>{h.city}, {h.state}</td>
                    <td>{h.user?.name || 'N/A'}</td>
                    <td>{h.beds}</td>
                    <td>
                      <span className={`badge ${h.verified ? 'badge-success' : 'badge-warning'}`}>
                        {h.verified ? '✓ Verified' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className={`btn btn-sm ${h.verified ? 'btn-secondary' : 'btn-success'}`}
                        onClick={() => handleVerifyHospital(h.id)}
                        title={h.verified ? 'Unverify' : 'Verify'}
                      >
                        {h.verified ? <FiX /> : <FiCheck />}
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDeleteHospital(h.id, h.name)} title="Delete">
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
