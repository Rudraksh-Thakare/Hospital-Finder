import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api';
import toast from 'react-hot-toast';
import { 
  FiSave, FiUser, FiMail, FiCalendar, FiActivity, 
  FiPhone, FiMapPin, FiAlertCircle, FiHeart 
} from 'react-icons/fi';

export default function PatientProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    bloodGroup: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await userAPI.getProfile();
      if (res.data) {
        setFormData({
          age: res.data.age || '',
          gender: res.data.gender || '',
          bloodGroup: res.data.bloodGroup || '',
          phone: res.data.phone || '',
          address: res.data.address || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userAPI.updateProfile(formData);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"><div className="spinner"></div></div></div>;

  return (
    <div className="page-container fade-in">
      <div className="dashboard-header" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 className="dashboard-title" style={{ fontSize: '2.5rem', color: 'var(--primary-dark)' }}>My Profile</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Manage your personal demographic and medical information</p>
      </div>

      <div className="card shadow-lg" style={{ maxWidth: '850px', margin: '0 auto', padding: '3rem', borderRadius: 'var(--radius-xl)' }}>
        
        <form onSubmit={handleSubmit}>
          
          {/* Section 1: Account Info (Read Only) */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem' }}>
              <span style={{ padding: '0.5rem', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '8px' }}><FiUser /></span> Account Details
            </h3>
            <div className="row g-4">
              <div className="col-12 col-md-6 form-group mb-0">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiUser size={14}/> Full Name</label>
                <input type="text" className="form-input" value={user?.name || ''} disabled style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
              </div>
              <div className="col-12 col-md-6 form-group mb-0">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiMail size={14}/> Email Address</label>
                <input type="email" className="form-input" value={user?.email || ''} disabled style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', cursor: 'not-allowed' }} />
              </div>
            </div>
          </div>

          {/* Section 2: Demographics */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem' }}>
              <span style={{ padding: '0.5rem', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '8px' }}><FiHeart /></span> Biometrics
            </h3>
            <div className="row g-4">
              <div className="col-12 col-md-4 form-group mb-0">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiCalendar size={14}/> Age</label>
                <input type="number" className="form-input" name="age" value={formData.age} onChange={handleChange} min="0" max="150" placeholder="e.g. 28" />
              </div>
              <div className="col-12 col-md-4 form-group mb-0">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiUser size={14}/> Gender</label>
                <select className="form-select" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-12 col-md-4 form-group mb-0">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiActivity size={14}/> Blood Group</label>
                <select className="form-select" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                  <option value="">Select Group</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Address */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--border)', paddingBottom: '0.75rem' }}>
              <span style={{ padding: '0.5rem', background: 'rgba(14, 165, 233, 0.15)', color: 'var(--secondary)', borderRadius: '8px' }}><FiMapPin /></span> Contact Details
            </h3>
            <div className="row g-4">
              <div className="col-12 form-group mb-0">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiPhone size={14}/> Phone Number</label>
                <input type="tel" className="form-input" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="col-12 form-group mb-0">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><FiMapPin size={14}/> Full Address</label>
                <textarea className="form-textarea" name="address" value={formData.address} onChange={handleChange} rows="2" placeholder="123 Medical Way, City, State, ZIP"></textarea>
              </div>
            </div>
          </div>


          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 2.5rem' }}
              disabled={saving}
            >
              <FiSave size={18} /> {saving ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
