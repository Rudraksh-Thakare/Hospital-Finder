import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { hospitalAPI, appointmentAPI } from '../api';
import toast from 'react-hot-toast';
import { FiSave, FiMapPin, FiEdit3, FiUpload, FiX, FiImage, FiChevronDown, FiSearch, FiCalendar, FiClock, FiUser, FiActivity } from 'react-icons/fi';
import { FaHospitalAlt } from 'react-icons/fa';

const API_BASE = 'http://localhost:5000';

const SPECIALTY_OPTIONS = [
  'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology',
  'Dermatology', 'Gastroenterology', 'Ophthalmology', 'ENT',
  'Gynecology', 'Urology', 'Pulmonology', 'Nephrology',
  'Psychiatry', 'Radiology', 'General Surgery', 'General Medicine'
];

const EMPTY_FORM = {
  name: '', description: '', address: '', city: '', state: '',
  phone: '', email: '', website: '', latitude: '', longitude: '',
  beds: '', emergency: false, isGovernment: false, imageUrl: '',
  openingTime: '09:00', closingTime: '17:00', slotDuration: 60, slotCapacity: 5
};

export default function HospitalDashboard() {
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [specDropdownOpen, setSpecDropdownOpen] = useState(false);
  
  // Appointments state
  const [activeTab, setActiveTab] = useState('profile');
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Schedule state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [publishedSlots, setPublishedSlots] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => { fetchMyHospital(); }, []);

  // Close specialty dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSpecDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchMyHospital = async () => {
    try {
      const res = await hospitalAPI.getMyProfile();
      if (res.data) {
        setHospital(res.data);
        setFormData({
          ...res.data,
          beds: res.data.beds?.toString() || '',
          latitude: res.data.latitude?.toString() || '',
          longitude: res.data.longitude?.toString() || '',
          openingTime: res.data.openingTime ? res.data.openingTime.substring(0, 5) : '09:00',
          closingTime: res.data.closingTime ? res.data.closingTime.substring(0, 5) : '17:00',
          slotDuration: res.data.slotDuration || 60,
          slotCapacity: res.data.slotCapacity || 5
        });
        setSelectedSpecialties(res.data.specialties || []);
        if (res.data.imageUrl) {
          setImagePreview(res.data.imageUrl.startsWith('http') ? res.data.imageUrl : `${API_BASE}${res.data.imageUrl}`);
        }
      } else {
        setIsEditing(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async (date) => {
    if (!hospital?.id || !date) return;
    setLoadingSchedule(true);
    try {
      const res = await hospitalAPI.getSlots(hospital.id, date);
      setPublishedSlots(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch schedule.');
    } finally {
      setLoadingSchedule(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'schedule' && hospital) {
      fetchSchedule(selectedDate);
    }
  }, [activeTab, selectedDate, hospital]);

  const generateSlots = () => {
    const slots = [];
    const { openingTime, closingTime, slotDuration, slotCapacity } = formData;
    if (!openingTime || !closingTime || !slotDuration) return slots;
    let [openHour, openMin] = openingTime.split(':').map(Number);
    let [closeHour, closeMin] = closingTime.split(':').map(Number);
    let currentMinutes = openHour * 60 + openMin;
    const endMinutes = closeHour * 60 + closeMin;
    const durationMinutes = parseInt(slotDuration);

    while (currentMinutes + durationMinutes <= endMinutes) {
      const h = Math.floor(currentMinutes / 60);
      const m = currentMinutes % 60;
      slots.push({
        time: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
        capacity: parseInt(slotCapacity)
      });
      currentMinutes += durationMinutes;
    }
    return slots;
  };

  const generatedSlots = generateSlots();

  const handlePublishSlot = async (slot) => {
    try {
      await hospitalAPI.publishSlots(hospital.id, {
        date: selectedDate,
        slots: [slot]
      });
      toast.success(`Published ${slot.time} slot.`);
      fetchSchedule(selectedDate);
    } catch (err) {
      toast.error('Failed to publish slot.');
    }
  };

  const handleRemoveSlot = async (slotId) => {
    try {
      await hospitalAPI.deleteSlot(hospital.id, slotId);
      toast.success('Removed slot.');
      fetchSchedule(selectedDate);
    } catch (err) {
      toast.error('Failed to remove slot.');
    }
  };

  const handlePublishAll = async () => {
    try {
      await hospitalAPI.publishSlots(hospital.id, {
        date: selectedDate,
        slots: generatedSlots
      });
      toast.success('Published all generated slots for this date!');
      fetchSchedule(selectedDate);
    } catch (err) {
      toast.error('Failed to publish slots.');
    }
  };



  useEffect(() => {
    if (hospital && activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [hospital, activeTab]);

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const res = await appointmentAPI.getHospitalAppointments();
      setAppointments(res.data);
    } catch (err) {
      toast.error('Failed to load appointments');
    } finally {
      setLoadingAppointments(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await appointmentAPI.updateStatus(id, status);
      toast.success('Status updated');
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleSpecialty = (spec) => {
    setSelectedSpecialties(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let imageUrl = formData.imageUrl;

      // Upload new image if selected
      if (imageFile) {
        setUploading(true);
        const uploadRes = await hospitalAPI.uploadImage(imageFile);
        imageUrl = uploadRes.data.imageUrl;
        setUploading(false);
      }

      const data = {
        ...formData,
        specialties: selectedSpecialties,
        beds: parseInt(formData.beds) || 0,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        slotDuration: parseInt(formData.slotDuration),
        slotCapacity: parseInt(formData.slotCapacity),
        imageUrl
      };

      if (hospital) {
        const res = await hospitalAPI.update(hospital.id, data);
        setHospital(res.data);
        toast.success('Hospital updated successfully!');
      } else {
        const res = await hospitalAPI.create(data);
        setHospital(res.data);
        toast.success('Hospital created successfully!');
      }
      setImageFile(null);
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save hospital.');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData({
            ...formData,
            latitude: pos.coords.latitude.toString(),
            longitude: pos.coords.longitude.toString()
          });
          toast.success('Location set to your current position!');
        },
        () => toast.error('Could not get your location.')
      );
    }
  };

  const geocodeFromAddress = async () => {
    const { address, city, state } = formData;
    if (!address && !city) {
      toast.error('Please enter at least an address or city first.');
      return;
    }
    setGeocoding(true);
    try {
      const queryParts = [address, city, state].filter(Boolean).join(', ');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryParts)}&format=json&limit=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        setFormData({
          ...formData,
          latitude: parseFloat(data[0].lat).toFixed(6),
          longitude: parseFloat(data[0].lon).toFixed(6)
        });
        toast.success(`Coordinates found for "${queryParts}"`);
      } else {
        toast.error('Could not find coordinates for this address. Try being more specific.');
      }
    } catch (err) {
      toast.error('Geocoding failed. Please check your internet connection.');
    } finally {
      setGeocoding(false);
    }
  };

  const getImageSrc = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_BASE}${url}`;
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"><div className="spinner"></div></div></div>;

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Hospital Dashboard</h1>
        <p className="page-subtitle">Welcome, {user?.name}. Manage your hospital profile and appointments.</p>
      </div>

      {hospital && !isEditing && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
            onClick={() => setActiveTab('profile')}
          >
            Hospital Profile
          </button>
          <button 
            className={`btn ${activeTab === 'appointments' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
            onClick={() => setActiveTab('appointments')}
          >
            <FiCalendar style={{ marginRight: 8 }} /> Appointments
          </button>
          <button 
            className={`btn ${activeTab === 'schedule' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
            onClick={() => setActiveTab('schedule')}
          >
            <FiClock style={{ marginRight: 8 }} /> Manage Schedule
          </button>
        </div>
      )}

      {/* Manage Schedule Tab */}
      {hospital && !isEditing && activeTab === 'schedule' && (
        <div className="card">
          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Publish Slots</h3>
            <button className="btn btn-outline btn-sm" onClick={() => fetchSchedule(selectedDate)} disabled={loadingSchedule}>
              Refresh
            </button>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Configure your daily working hours below to generate slots, then explicitly publish them for a specific date.
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
              const data = {
                ...formData,
                specialties: selectedSpecialties,
                beds: parseInt(formData.beds) || 0,
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
                slotDuration: parseInt(formData.slotDuration),
                slotCapacity: parseInt(formData.slotCapacity),
              };
              const res = await hospitalAPI.update(hospital.id, data);
              setHospital(res.data);
              toast.success('Default configuration saved successfully!');
            } catch (err) {
              toast.error('Failed to save defaults.');
            } finally {
              setSaving(false);
            }
          }} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Default Slot Configuration</h4>
            <div className="row g-3 mb-2">
              <div className="col-12 col-md-3 form-group">
                <label className="form-label">Opening Time</label>
                <input className="form-input" type="time" name="openingTime" value={formData.openingTime} onChange={handleChange} required />
              </div>
              <div className="col-12 col-md-3 form-group">
                <label className="form-label">Closing Time</label>
                <input className="form-input" type="time" name="closingTime" value={formData.closingTime} onChange={handleChange} required />
              </div>
              <div className="col-12 col-md-3 form-group">
                <label className="form-label">Slot Duration</label>
                <select className="form-input" name="slotDuration" value={formData.slotDuration} onChange={handleChange} required>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={120}>2 Hours</option>
                </select>
              </div>
              <div className="col-12 col-md-3 form-group">
                <label className="form-label">Capacity (Per Slot)</label>
                <input className="form-input" type="number" name="slotCapacity" min="1" max="100" value={formData.slotCapacity} onChange={handleChange} required />
              </div>
            </div>
            <button className="btn btn-outline btn-sm" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save as Defaults'}
            </button>
          </form>

          <div className="form-group" style={{ marginBottom: '1rem', maxWidth: '300px' }}>
            <label className="form-label" style={{ fontWeight: 'bold' }}>1. Select Date to Publish</label>
            <input 
              type="date" 
              className="form-control" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>Available Slots for {new Date(selectedDate).toLocaleDateString()}</h4>
              <button className="btn btn-primary btn-sm" onClick={handlePublishAll}>
                Publish All Generated Slots
              </button>
            </div>
            
            {loadingSchedule ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner"></div></div>
            ) : generatedSlots.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                No slots generated. Please check your Appointment Settings (Opening/Closing hours).
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                {generatedSlots.map(slot => {
                  const published = publishedSlots.find(s => s.slotTime.substring(0,5) === slot.time);
                  return (
                    <div 
                      key={slot.time}
                      style={{ 
                        border: `1px solid ${published ? 'var(--success-color)' : 'var(--border-color)'}`,
                        borderRadius: '8px',
                        padding: '1rem',
                        textAlign: 'center',
                        backgroundColor: published ? 'rgba(46, 204, 113, 0.1)' : 'var(--bg-secondary)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '1.1rem', color: published ? 'var(--success-color)' : 'var(--text-primary)' }}>
                        {slot.time}
                      </span>
                      {published ? (
                        <button className="btn btn-sm" style={{ backgroundColor: '#ff4757', color: 'white', padding: '0.25rem' }} onClick={() => handleRemoveSlot(published.id)}>
                          Remove
                        </button>
                      ) : (
                        <button className="btn btn-sm btn-outline" style={{ padding: '0.25rem' }} onClick={() => handlePublishSlot(slot)}>
                          Publish
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}



      {/* Appointments Tab */}
      {hospital && !isEditing && activeTab === 'appointments' && (
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">Patient Appointments</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchAppointments} disabled={loadingAppointments}>
              Refresh
            </button>
          </div>

          {loadingAppointments ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner"></div></div>
          ) : appointments.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No appointments yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem 0' }}>Patient</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map(apt => (
                    <tr key={apt.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem 0' }}>
                        <div style={{ fontWeight: 500 }}><FiUser /> {apt.patientName || apt.accountHolderName}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {apt.age ? `${apt.age} yrs, ${apt.gender}` : ''}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {apt.contactNumber ? `📞 ${apt.contactNumber}` : `✉️ ${apt.patientEmail}`}
                        </div>
                      </td>
                      <td>
                        <div><FiCalendar /> {new Date(apt.appointmentDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><FiClock /> {apt.appointmentTime}</div>
                      </td>
                      <td>
                        <select 
                          className="form-control" 
                          style={{ padding: '0.25rem', width: 'auto', fontSize: '0.85rem' }}
                          value={apt.status}
                          onChange={(e) => handleUpdateStatus(apt.id, e.target.value)}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>
                      <td>
                         <button className="btn btn-sm btn-success" onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')} disabled={apt.status === 'CONFIRMED'} style={{ marginRight: 4 }}>Confirm</button>
                         <button className="btn btn-sm btn-danger" onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')} disabled={apt.status === 'CANCELLED'}>Cancel</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {hospital && !isEditing && activeTab === 'profile' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div className="detail-header-icon" style={{ width: 56, height: 56, fontSize: '1.5rem', overflow: 'hidden', padding: hospital.imageUrl ? 0 : 'auto' }}>
                {hospital.imageUrl ? <img src={getImageSrc(hospital.imageUrl)} alt={hospital.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaHospitalAlt />}
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{hospital.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <FiMapPin style={{ marginRight: 4 }} />{hospital.address}, {hospital.city}, {hospital.state}
                </p>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {hospital.verified
                    ? <span className="badge badge-success">✓ Verified</span>
                    : <span className="badge badge-warning">Pending Verification</span>
                  }
                  {hospital.emergency && <span className="badge badge-danger">Emergency</span>}
                  {hospital.isGovernment && <span className="badge badge-primary">Government</span>}
                </div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <FiEdit3 /> Edit Profile
            </button>
          </div>

          <div className="row g-3" style={{ marginTop: '1.5rem' }}>
            <div className="col-12 col-md-6 detail-info-item"><span className="detail-info-label">Beds</span><span className="detail-info-value">{hospital.beds}</span></div>
            <div className="col-12 col-md-6 detail-info-item"><span className="detail-info-label">Phone</span><span className="detail-info-value">{hospital.phone || 'N/A'}</span></div>
            <div className="col-12 col-md-6 detail-info-item"><span className="detail-info-label">Email</span><span className="detail-info-value">{hospital.email || 'N/A'}</span></div>
            <div className="col-12 col-md-6 detail-info-item"><span className="detail-info-label">Specialties</span><span className="detail-info-value">{hospital.specialties?.join(', ') || 'N/A'}</span></div>
          </div>
        </div>
      )}

      {/* Form */}
      {isEditing && (
        <div className="card">
          <div className="section-header">
            <h3 className="section-title">{hospital ? 'Edit Hospital' : 'Register Your Hospital'}</h3>
            {hospital && (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(false)}>Cancel</button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Hospital Name *</label>
              <input className="form-input" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter hospital name" />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" name="description" value={formData.description || ''} onChange={handleChange} placeholder="Describe your hospital..." />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">Hospital Image</label>
              <div className="image-upload-area">
                {imagePreview ? (
                  <div className="image-upload-preview">
                    <img src={imagePreview} alt="Hospital preview" />
                    <button type="button" className="image-upload-remove" onClick={removeImage}>
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <div className="image-upload-placeholder" onClick={() => fileInputRef.current?.click()}>
                    <FiImage style={{ fontSize: '2rem', color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Click to upload an image</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>JPEG, PNG, WebP — Max 5MB</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                {imagePreview && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()} style={{ marginTop: '0.75rem' }}>
                    <FiUpload /> Change Image
                  </button>
                )}
              </div>
            </div>

            <div className="row g-3 mb-2">
              <div className="col-12 col-md-6 form-group">
                <label className="form-label">Address *</label>
                <input className="form-input" name="address" value={formData.address} onChange={handleChange} required placeholder="Street address" />
              </div>
              <div className="col-12 col-md-6 form-group">
                <label className="form-label">City *</label>
                <input className="form-input" name="city" value={formData.city} onChange={handleChange} required placeholder="City" />
              </div>
            </div>

            <div className="row g-3 mb-2">
              <div className="col-12 col-md-6 form-group">
                <label className="form-label">State *</label>
                <input className="form-input" name="state" value={formData.state} onChange={handleChange} required placeholder="State" />
              </div>
              <div className="col-12 col-md-6 form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="+91 XXX XXXX" />
              </div>
            </div>

            <div className="row g-3 mb-2">
              <div className="col-12 col-md-6 form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="hospital@example.com" />
              </div>
              <div className="col-12 col-md-6 form-group">
                <label className="form-label">Website</label>
                <input className="form-input" name="website" value={formData.website || ''} onChange={handleChange} placeholder="https://..." />
              </div>
            </div>

            <div className="row g-3 mb-2">
              <div className="col-12 col-md-6 form-group">
                <label className="form-label">Latitude *</label>
                <input className="form-input" name="latitude" type="number" step="any" value={formData.latitude} onChange={handleChange} required placeholder="Auto-filled from address" />
              </div>
              <div className="col-12 col-md-6 form-group">
                <label className="form-label">Longitude *</label>
                <input className="form-input" name="longitude" type="number" step="any" value={formData.longitude} onChange={handleChange} required placeholder="Auto-filled from address" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={geocodeFromAddress} disabled={geocoding}>
                <FiSearch /> {geocoding ? 'Finding...' : 'Find from Address'}
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={useCurrentLocation}>
                <FiMapPin /> Use My Current Location
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
              💡 Fill in Address, City & State above, then click "Find from Address" to auto-detect coordinates.
            </p>

            <div className="row g-3 mb-2">
              {/* Multi-select Specialties Dropdown */}
              <div className="col-12 col-md-6 form-group">
                <label className="form-label">Specialties</label>
                <div className="multi-select" ref={dropdownRef}>
                  <div
                    className="multi-select-trigger"
                    onClick={() => setSpecDropdownOpen(!specDropdownOpen)}
                  >
                    <div className="multi-select-tags">
                      {selectedSpecialties.length === 0 ? (
                        <span className="multi-select-placeholder">Select specialties...</span>
                      ) : (
                        selectedSpecialties.map(s => (
                          <span key={s} className="multi-select-tag">
                            {s}
                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleSpecialty(s); }}>
                              <FiX />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <FiChevronDown className={`multi-select-arrow ${specDropdownOpen ? 'open' : ''}`} />
                  </div>
                  {specDropdownOpen && (
                    <div className="multi-select-dropdown">
                      {SPECIALTY_OPTIONS.map(spec => (
                        <label key={spec} className="multi-select-option">
                          <input
                            type="checkbox"
                            checked={selectedSpecialties.includes(spec)}
                            onChange={() => toggleSpecialty(spec)}
                          />
                          <span>{spec}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-6 form-group">
                <label className="form-label">Number of Beds</label>
                <input className="form-input" name="beds" type="number" value={formData.beds} onChange={handleChange} placeholder="100" />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <label className="form-checkbox">
                <input type="checkbox" name="emergency" checked={formData.emergency || false} onChange={handleChange} />
                <span>24/7 Emergency Services</span>
              </label>
              <label className="form-checkbox" style={{ color: 'var(--primary-dark)' }}>
                <input type="checkbox" name="isGovernment" checked={formData.isGovernment || false} onChange={handleChange} />
                <span>Government Hospital</span>
              </label>
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={saving || uploading} style={{ width: '100%', marginTop: '1rem' }}>
              <FiSave /> {uploading ? 'Uploading Image...' : saving ? 'Saving...' : (hospital ? 'Update Hospital' : 'Register Hospital')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
