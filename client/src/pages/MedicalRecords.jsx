import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api';
import toast from 'react-hot-toast';
import { FiUpload, FiFile, FiTrash2, FiShare2, FiCopy } from 'react-icons/fi';

export default function MedicalRecords() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [shareToken, setShareToken] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await userAPI.getDocuments();
      setDocuments(res.data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return toast.error('Please provide a file and a title');

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      await userAPI.uploadDocument(formData);
      toast.success('Document uploaded successfully');
      setFile(null);
      setTitle('');
      fetchDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await userAPI.deleteDocument(id);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleGenerateShareLink = async () => {
    try {
      const res = await userAPI.generateShareToken();
      setShareToken(res.data.shareToken);
      toast.success('Share link generated!');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to generate share link');
    }
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"><div className="spinner"></div></div></div>;

  return (
    <div className="page-container fade-in">
      <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
        <h1 className="dashboard-title">My Medical Records</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage and share your medical documents securely.</p>
      </div>

      <div className="row g-4">
        {/* Upload Section */}
        <div className="col-12 col-md-4">
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Upload Document</h3>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Document Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Blood Test Report"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">File (PDF, DOC, Image)</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={(e) => setFile(e.target.files[0])}
                  accept=".pdf,.doc,.docx,image/*"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                disabled={uploading}
              >
                <FiUpload /> {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>

          {/* Share Profile Section */}
          <div className="card" style={{ marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiShare2 /> Share Profile
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Generate a secure link to share your medical records with a doctor.
            </p>
            
            {!shareToken ? (
              <button className="btn btn-secondary" onClick={handleGenerateShareLink} style={{ width: '100%' }}>
                Generate Shareable Link
              </button>
            ) : (
              <div>
                <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', wordBreak: 'break-all', marginBottom: '1rem' }}>
                  {window.location.origin}/shared/{shareToken}
                </div>
                <button className="btn btn-primary" onClick={copyToClipboard} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <FiCopy /> Copy Link
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className="col-12 col-md-8">
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Your Documents</h3>
            {documents.length === 0 ? (
              <div className="text-center" style={{ padding: '3rem 0', color: 'var(--text-secondary)' }}>
                <FiFile size={48} style={{ color: 'var(--border-color)', marginBottom: '1rem' }} />
                <p>No documents uploaded yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {documents.map((doc) => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', color: 'var(--primary-color)' }}>
                        <FiFile size={24} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{doc.title}</h4>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a href={`http://localhost:5000${doc.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                        View
                      </a>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(doc.id)}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
