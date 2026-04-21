import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiUser } from 'react-icons/fi';
import { FaHospitalAlt, FaUserInjured } from 'react-icons/fa';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'PATIENT'
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await authAPI.login({ email: formData.email, password: formData.password });
      } else {
        res = await authAPI.register(formData);
      }

      const { token, user } = res.data;
      login(user, token);
      toast.success(`Welcome, ${user.name}!`);

      // Redirect based on role
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'HOSPITAL') navigate('/hospital/dashboard');
      else navigate('/hospitals');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Sign in to access your dashboard' : 'Join the healthcare platform'}
        </p>

        <div className="auth-tabs">
          <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>Login</button>
          <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>Register</button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label className="form-label"><FiUser style={{ marginRight: 4 }} /> Full Name</label>
                <input
                  className="form-input" type="text" name="name"
                  placeholder="Enter your name" value={formData.name}
                  onChange={handleChange} required
                />
              </div>

              <div className="form-group">
                <label className="form-label">I am a...</label>
                <div className="role-selector">
                  <div
                    className={`role-option ${formData.role === 'PATIENT' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, role: 'PATIENT' })}
                  >
                    <div className="role-option-icon"><FaUserInjured /></div>
                    <div className="role-option-label">Patient / User</div>
                  </div>
                  <div
                    className={`role-option ${formData.role === 'HOSPITAL' ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, role: 'HOSPITAL' })}
                  >
                    <div className="role-option-icon"><FaHospitalAlt /></div>
                    <div className="role-option-label">Hospital</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label"><FiMail style={{ marginRight: 4 }} /> Email</label>
            <input
              className="form-input" type="email" name="email"
              placeholder="Enter your email" value={formData.email}
              onChange={handleChange} required
            />
          </div>

          <div className="form-group">
            <label className="form-label"><FiLock style={{ marginRight: 4 }} /> Password</label>
            <input
              className="form-input" type="password" name="password"
              placeholder="Enter your password" value={formData.password}
              onChange={handleChange} required minLength={6}
            />
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
          {isLogin ? (
            <>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>Register</a></>
          ) : (
            <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>Login</a></>
          )}
        </div>
      </div>
    </div>
  );
}
