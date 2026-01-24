'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/utils/api';
import { getAuthToken } from '@/utils/auth';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    dashboardName: 'Admin Dashboard',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      
      if (!token) {
        setError('Authentication required. Please login again.');
        setLoading(false);
        return;
      }

      try {
        const response = await adminAPI.getProfile(token);
        
        if (response.success && response.data?.admin) {
          const admin = response.data.admin;
          setProfile({
            username: admin.username || '',
            email: admin.email || '',
            dashboardName: admin.dashboardName || 'Admin Dashboard',
          });
        } else {
          setError(response.error || 'Failed to load profile');
        }
      } catch (apiError) {
        // Handle authentication errors specifically
        if (apiError.status === 401 || apiError.message?.includes('authentication') || apiError.message?.includes('token')) {
          setError('Your session has expired. Please login again.');
          // Clear auth and redirect to login
          const { clearAuth } = await import('@/utils/auth');
          clearAuth();
          setTimeout(() => {
            window.location.href = '/admin';
          }, 2000);
        } else {
          setError(apiError.message || 'Failed to load profile');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validatePassword = () => {
    if (passwordForm.newPassword.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return 'New password and confirm password do not match';
    }
    return null;
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required. Please login again.');
        setSaving(false);
        return;
      }

      const updates = {};
      if (profile.username) updates.username = profile.username;
      if (profile.email) updates.email = profile.email;
      if (profile.dashboardName) updates.dashboardName = profile.dashboardName;

      if (Object.keys(updates).length === 0) {
        setError('No changes to save');
        setSaving(false);
        return;
      }

      try {
        const response = await adminAPI.updateProfile(token, updates);
        
        if (response.success) {
          setSuccess('Profile updated successfully!');
          // Update dashboard name in localStorage for immediate effect
          if (updates.dashboardName) {
            localStorage.setItem('dashboardName', updates.dashboardName);
            // Dispatch custom event for same-tab updates
            window.dispatchEvent(new CustomEvent('dashboardNameChanged', {
              detail: { dashboardName: updates.dashboardName }
            }));
          }
          // Refresh profile data
          await fetchProfile();
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(response.error || 'Failed to update profile');
        }
      } catch (apiError) {
        // Handle authentication errors specifically
        if (apiError.status === 401 || apiError.message?.includes('authentication') || apiError.message?.includes('token')) {
          setError('Your session has expired. Please login again.');
          // Clear auth and redirect to login
          const { clearAuth } = await import('@/utils/auth');
          clearAuth();
          setTimeout(() => {
            window.location.href = '/admin';
          }, 2000);
        } else {
          setError(apiError.message || 'Failed to update profile');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const validationError = validatePassword();
      if (validationError) {
        setError(validationError);
        setSaving(false);
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setError('Authentication required. Please login again.');
        setSaving(false);
        return;
      }

      try {
        const response = await adminAPI.updateProfile(token, {
          password: passwordForm.newPassword,
          currentPassword: passwordForm.currentPassword,
        });
        
        if (response.success) {
          setSuccess('Password updated successfully!');
          setPasswordForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setShowPasswordFields(false);
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(response.error || 'Failed to update password');
        }
      } catch (apiError) {
        // Handle authentication errors specifically
        if (apiError.status === 401 || apiError.message?.includes('authentication') || apiError.message?.includes('token')) {
          setError('Your session has expired. Please login again.');
          // Clear auth and redirect to login
          const { clearAuth } = await import('@/utils/auth');
          clearAuth();
          setTimeout(() => {
            window.location.href = '/admin';
          }, 2000);
        } else {
          setError(apiError.message || 'Failed to update password');
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 px-md-3 px-lg-4" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3 mb-md-4 gap-3">
        <div className="w-100 w-md-auto">
          <div className="d-flex align-items-center mb-2">
            <div
              className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
              style={{
                width: 'clamp(35px, 8vw, 40px)',
                height: 'clamp(35px, 8vw, 40px)',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
              </svg>
            </div>
            <div>
              <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>Settings</h2>
              <p className="text-muted mb-0 small d-none d-md-block" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>Manage your admin profile and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert" style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}>
          <div className="d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
            <span>{error}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show mb-3" role="alert" style={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}>
          <div className="d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
            </svg>
            <span>{success}</span>
          </div>
          <button type="button" className="btn-close" onClick={() => setSuccess(null)} aria-label="Close" />
        </div>
      )}

      <div className="row g-3 g-md-4">
        {/* Admin Profile Card */}
        <div className="col-12 col-lg-8">
          <div
            className="card h-100"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 240, 0.95) 100%)',
              border: '1px solid rgba(255, 140, 0, 0.2)',
              boxShadow: '0 4px 20px rgba(255, 140, 0, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="card-header border-bottom px-3 px-md-4 py-3" style={{ background: 'transparent' }}>
              <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>
                Admin Profile
              </h5>
            </div>
            <div className="card-body p-3 p-md-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold mb-2">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.username}
                    onChange={(e) => handleProfileChange('username', e.target.value)}
                    placeholder="Enter username"
                    style={{ borderRadius: '8px', padding: '0.6rem 1rem' }}
                  />
                  <small className="text-muted">Username must be 3-50 characters, lowercase letters, numbers, and underscores only</small>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold mb-2">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={profile.email}
                    onChange={(e) => handleProfileChange('email', e.target.value)}
                    placeholder="Enter email address"
                    style={{ borderRadius: '8px', padding: '0.6rem 1rem' }}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold mb-2">Dashboard Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profile.dashboardName}
                    onChange={(e) => handleProfileChange('dashboardName', e.target.value)}
                    placeholder="Enter dashboard name"
                    maxLength={100}
                    style={{ borderRadius: '8px', padding: '0.6rem 1rem' }}
                  />
                  <small className="text-muted">This name will be displayed in the admin dashboard header</small>
                </div>
              </div>
            </div>
            <div className="card-footer border-top px-3 px-md-4 py-3 d-flex justify-content-end" style={{ background: 'transparent' }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveProfile}
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.6rem 1.5rem',
                  fontWeight: '600',
                }}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Password Change Card */}
        <div className="col-12 col-lg-4">
          <div
            className="card h-100"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 248, 255, 0.95) 100%)',
              border: '1px solid rgba(0, 102, 204, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 102, 204, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="card-header border-bottom px-3 px-md-4 py-3" style={{ background: 'transparent' }}>
              <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                  <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                </svg>
                Change Password
              </h5>
            </div>
            <div className="card-body p-3 p-md-4">
              {!showPasswordFields ? (
                <div className="text-center py-3">
                  <p className="text-muted mb-3">Click the button below to change your password</p>
                  <button
                    className="btn btn-outline-primary"
                    onClick={() => setShowPasswordFields(true)}
                    style={{ borderRadius: '8px' }}
                  >
                    Change Password
                  </button>
                </div>
              ) : (
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold mb-2">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                      placeholder="Enter current password"
                      style={{ borderRadius: '8px', padding: '0.6rem 1rem' }}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold mb-2">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                      style={{ borderRadius: '8px', padding: '0.6rem 1rem' }}
                    />
                    <small className="text-muted">Password must be at least 6 characters long</small>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                      style={{ borderRadius: '8px', padding: '0.6rem 1rem' }}
                    />
                  </div>
                </div>
              )}
            </div>
            {showPasswordFields && (
              <div className="card-footer border-top px-3 px-md-4 py-3 d-flex gap-2" style={{ background: 'transparent' }}>
                <button
                  className="btn btn-outline-secondary flex-grow-1"
                  onClick={() => {
                    setShowPasswordFields(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setError(null);
                  }}
                  disabled={saving}
                  style={{ borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-grow-1"
                  onClick={handleSavePassword}
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1rem',
                    fontWeight: '600',
                  }}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
