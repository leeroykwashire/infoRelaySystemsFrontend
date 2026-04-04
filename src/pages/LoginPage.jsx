import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../services/api';
import { setCredentials } from '../features/auth/authSlice';
import logoBroader from '../assets/images/logo_broader.png';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // RTK Query mutation hook for login
  const [login, { isLoading, error }] = useLoginMutation();

  // Clear form errors when user types
  useEffect(() => {
    if (formErrors.username || formErrors.password) {
      setFormErrors({});
    }
  }, [username, password]);

  // Validate form before submission
  const validateForm = () => {
    const errors = {};
    
    if (!username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Call login API
      const result = await login({ 
        username: username.trim(), 
        password 
      }).unwrap();
      
      // Store credentials in Redux (access token, refresh token, user info)
      dispatch(setCredentials({
        user: result.user,
        access: result.access,
        refresh: result.refresh,
      }));
      
      // Redirect to dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by RTK Query and displayed below
      console.error('Login failed:', err);
    }
  };

  return (
    <div 
      className="d-flex justify-content-center align-items-center" 
      style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}
    >
      <div className="card shadow-lg" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card-body p-4">
          {/* Header */}
          <div className="text-center mb-4">
            <img
              src={logoBroader}
              alt="Company logo"
              style={{ maxWidth: '100%', height: 'auto', maxHeight: '80px', objectFit: 'contain', marginBottom: '0.75rem' }}
            />
            <h2 className="my-3">Stock Management System</h2>
            <p className="text-muted">Sign in to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Username field */}
            <div className="mb-3">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                className={`form-control ${formErrors.username ? 'is-invalid' : ''}`}
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              {formErrors.username && (
                <div className="invalid-feedback">{formErrors.username}</div>
              )}
            </div>

            {/* Password field */}
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                className={`form-control ${formErrors.password ? 'is-invalid' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              {formErrors.password && (
                <div className="invalid-feedback">{formErrors.password}</div>
              )}
            </div>

            {/* API Error Message */}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error.data?.detail || 
                 error.data?.message || 
                 'Invalid username or password. Please try again.'}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer hint */}
          <div className="mt-4 text-center">
            <small className="text-muted">
              Contact your administrator for account access
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
