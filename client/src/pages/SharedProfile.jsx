import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userAPI } from '../api';
import { FiFile, FiDownloadCloud } from 'react-icons/fi';
import { FaHospitalAlt } from 'react-icons/fa';

export default function SharedProfile() {
  const { token } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await userAPI.getSharedProfile(token);
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch shared profile:', err);
        setError('Profile not found or link is invalid.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  if (loading) return <div className="page-container"><div className="loading-spinner"><div className="spinner"></div></div></div>;

  if (error) {
    return (
      <div className="page-container" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
          <h2 style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Simple Navbar for shared view */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
            <FaHospitalAlt /> VitaLink
          </div>
          <Link to="/" className="btn btn-secondary btn-sm">Go to VitaLink</Link>
        </div>

        <div className="card shadow-sm" style={{ padding: '2.5rem' }}>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Medical Profile</h1>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
              Patient: <strong style={{ color: 'var(--text-primary)' }}>{profile.name}</strong>
            </h2>

            {profile.profile && (
              <div style={{ marginTop: '1.5rem', background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Patient Details</h3>
                <div className="row g-3" style={{ fontSize: '0.95rem' }}>
                  {profile.profile.age && <div className="col-12 col-md-4"><strong>Age:</strong> {profile.profile.age}</div>}
                  {profile.profile.gender && <div className="col-12 col-md-4"><strong>Gender:</strong> {profile.profile.gender}</div>}
                  {profile.profile.bloodGroup && <div className="col-12 col-md-4"><strong>Blood Group:</strong> {profile.profile.bloodGroup}</div>}
                  {profile.profile.phone && <div className="col-12"><strong>Phone:</strong> {profile.profile.phone}</div>}
                  {profile.profile.address && <div className="col-12"><strong>Address:</strong> {profile.profile.address}</div>}
                </div>
              </div>
            )}
          </div>

          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Available Documents</h3>
          
          {profile.documents.length === 0 ? (
            <div className="text-center" style={{ padding: '2rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              This patient has no medical records available.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {profile.documents.map((doc) => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ color: 'var(--primary-color)' }}>
                      <FiFile size={24} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{doc.title}</h4>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiDownloadCloud /> View / Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
