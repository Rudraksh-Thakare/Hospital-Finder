import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hospitalAPI, appointmentAPI, userAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiCalendar, FiClock, FiMapPin, FiArrowLeft, FiUser } from 'react-icons/fi';

export default function BookAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking state
  const [patientName, setPatientName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [address, setAddress] = useState('');

  const [aptDate, setAptDate] = useState('');
  const [aptTime, setAptTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchHospital();
  }, [id]);

  useEffect(() => {
    if (aptDate && hospital?.id) {
      fetchSlots(aptDate);
    } else {
      setAvailableSlots([]);
      setAptTime('');
    }
  }, [aptDate, hospital]);

  const fetchHospital = async () => {
    try {
      const res = await hospitalAPI.getById(id);
      setHospital(res.data);
    } catch (err) {
      toast.error('Failed to fetch hospital details.');
      navigate('/hospitals');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const res = await appointmentAPI.getAvailableSlots(hospital.id, date);
      setAvailableSlots(res.data);
      const stillAvailable = res.data.find(s => s.time === aptTime && s.available);
      if (!stillAvailable) setAptTime('');
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const autoFillDetails = async () => {
    if (user) {
      try {
        const res = await userAPI.getProfile();
        const profile = res.data;
        
        setPatientName(user.name);
        if (profile) {
          setContactNumber(profile.phone || '');
          setAddress(profile.address || '');
          setAge(profile.age || '');
          setGender(profile.gender || 'Male');
        }
        toast.success('Auto-filled with your profile details.');
      } catch (err) {
        console.error('Failed to fetch profile for autofill', err);
        setPatientName(user.name);
        toast.error('Could not fetch full profile, autofilled name only.');
      }
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!aptDate || !aptTime) return toast.error('Please select date and time.');
    if (!patientName || !contactNumber || !age || !gender) return toast.error('Please fill all patient details.');

    setBookingLoading(true);
    try {
      await appointmentAPI.book({
        hospitalId: hospital.id,
        appointmentDate: aptDate,
        appointmentTime: aptTime,
        patientName,
        contactNumber,
        age,
        gender,
        address
      });
      toast.success('Appointment booked successfully!');
      navigate('/my-appointments');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading-spinner"><div className="spinner"></div></div></div>;
  if (!hospital) return <div className="page-container"><h2>Hospital not found.</h2></div>;

  return (
    <div className="page-container fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/hospitals/${id}`)} style={{ marginBottom: '1.5rem' }}>
        <FiArrowLeft /> Back to Hospital
      </button>

      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="page-title" style={{ marginBottom: '0.5rem' }}>Book Appointment</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>
            with <strong style={{ color: 'var(--primary-dark)' }}>{hospital.name}</strong>
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <FiMapPin /> {hospital.city}, {hospital.state}
          </p>
        </div>

        <form onSubmit={handleBookAppointment}>
          <div className="section-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 0 }}><FiUser /> Patient Details</h3>
            <button type="button" className="btn btn-outline btn-sm" onClick={autoFillDetails}>
              Auto-fill my details
            </button>
          </div>

          <div className="row g-3" style={{ marginBottom: '1.5rem' }}>
            <div className="col-12 col-md-6 form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" value={patientName} onChange={e => setPatientName(e.target.value)} required placeholder="e.g. John Doe" />
            </div>
            <div className="col-12 col-md-6 form-group">
              <label className="form-label">Contact Number *</label>
              <input type="text" className="form-input" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required placeholder="e.g. 9876543210" />
            </div>
            <div className="col-12 col-md-6 form-group">
              <label className="form-label">Age *</label>
              <input type="number" className="form-input" value={age} onChange={e => setAge(e.target.value)} required placeholder="e.g. 35" min="0" max="150" />
            </div>
            <div className="col-12 col-md-6 form-group">
              <label className="form-label">Gender *</label>
              <select className="form-input" value={gender} onChange={e => setGender(e.target.value)} required>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="col-12 form-group">
              <label className="form-label">Address (Optional)</label>
              <input type="text" className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Full Address" />
            </div>
          </div>

          <div className="section-header" style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
            <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 0 }}><FiCalendar /> Schedule</h3>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ fontSize: '1rem' }}>Select Date *</label>
            <input
              type="date"
              className="form-control"
              style={{ padding: '0.75rem', fontSize: '1rem' }}
              value={aptDate}
              onChange={(e) => setAptDate(e.target.value)}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {aptDate && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '1rem' }}><FiClock /> Select Time Slot</label>
              <div style={{ background: 'var(--background)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {loadingSlots ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner"></div></div>
                ) : availableSlots.length === 0 ? (
                  <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No slots available for this date.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                    {availableSlots.map(slot => (
                      <button
                        key={slot.time}
                        type="button"
                        className={`btn ${aptTime === slot.time ? 'btn-primary' : 'btn-outline'}`}
                        style={{ 
                          opacity: slot.available ? 1 : 0.5,
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '0.75rem',
                          width: '100%'
                        }}
                        disabled={!slot.available}
                        onClick={() => setAptTime(slot.time)}
                      >
                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{slot.time}</span>
                        <span style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          {slot.available ? `${slot.capacity - slot.booked} left` : 'Full'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-success btn-lg" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1.5rem' }} 
            disabled={bookingLoading || !aptDate || !aptTime}
          >
            {bookingLoading ? 'Processing Booking...' : 'Confirm Appointment'}
          </button>
        </form>
      </div>
    </div>
  );
}
