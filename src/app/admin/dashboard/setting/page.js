'use client';

import { useState } from 'react';

export default function Settings() {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const [settings, setSettings] = useState({
    siteName: 'Algo Platform',
    siteDescription: 'Advanced algorithm and analytics platform',
    siteUrl: 'https://algo-platform.com',
    adminEmail: 'admin@algo-platform.com',
    supportEmail: 'support@algo-platform.com',
    timezone: 'UTC',
    language: 'en',
    primaryColor: '#ff8c00',
    secondaryColor: '#0066cc',
    theme: 'light',
    twoFactorAuth: true,
    sessionTimeout: '30',
    passwordMinLength: '8',
    enableAnalytics: true,
    maintenanceMode: false
  });

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleToggle = (field) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSaving(false);
    setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });

    setTimeout(() => setSaveMessage(null), 3000);
  };

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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-md-none" style={{ width: 'clamp(16px, 4vw, 20px)', height: 'clamp(16px, 4vw, 20px)' }}>
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
              </svg>
            </div>
            <div>
              <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>Settings</h2>
              <p className="text-muted mb-0 small d-none d-md-block" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)' }}>Manage platform configuration and preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {saveMessage && (
        <div
          className={`alert alert-${saveMessage.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show mb-3`}
          role="alert"
          style={{
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            fontSize: 'clamp(0.875rem, 2vw, 1rem)'
          }}
        >
          <div className="d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2" style={{ width: 'clamp(16px, 4vw, 20px)', height: 'clamp(16px, 4vw, 20px)', flexShrink: 0 }}>
              {saveMessage.type === 'success' ? (
                <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
              ) : (
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16zM4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              )}
            </svg>
            <span style={{ wordBreak: 'break-word' }}>{saveMessage.text}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setSaveMessage(null)}
            aria-label="Close"
          />
        </div>
      )}

      <div className="row g-3 g-md-4">
        {/* General Settings Card */}
        <div className="col-12 col-lg-6">
          <div
            className="card h-100"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 240, 0.95) 100%)',
              border: '1px solid rgba(255, 140, 0, 0.2)',
              boxShadow: '0 4px 20px rgba(255, 140, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 140, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 140, 0, 0.1)';
            }}
          >
            <div className="card-header border-bottom px-3 px-md-4 py-3" style={{ background: 'transparent' }}>
              <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
                <span className="me-2">⚙️</span>
                General Settings
              </h5>
            </div>
            <div className="card-body p-3 p-md-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Site Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={settings.siteName}
                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                    style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Site URL</label>
                  <input
                    type="url"
                    className="form-control"
                    value={settings.siteUrl}
                    onChange={(e) => handleInputChange('siteUrl', e.target.value)}
                    style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Site Description</label>
                  <textarea
                    className="form-control"
                    value={settings.siteDescription}
                    onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                    rows="3"
                    style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', resize: 'vertical' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Admin Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={settings.adminEmail}
                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                    style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Support Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={settings.supportEmail}
                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                    style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Timezone</label>
                  <select
                    className="form-select"
                    value={settings.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                    style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Language</label>
                  <select
                    className="form-select"
                    value={settings.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance & Security Card */}
        <div className="col-12 col-lg-6">
          <div
            className="card h-100"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 240, 0.95) 100%)',
              border: '1px solid rgba(255, 140, 0, 0.2)',
              boxShadow: '0 4px 20px rgba(255, 140, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 140, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 140, 0, 0.1)';
            }}
          >
            <div className="card-header border-bottom px-3 px-md-4 py-3" style={{ background: 'transparent' }}>
              <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
                <span className="me-2">🎨</span>
                Appearance & Security
              </h5>
            </div>
            <div className="card-body p-3 p-md-4">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Primary Color</label>
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="color"
                      className="form-control form-control-color flex-shrink-0"
                      value={settings.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      style={{ width: 'clamp(50px, 12vw, 60px)', height: 'clamp(35px, 8vw, 40px)', borderRadius: '8px', border: '1px solid #dee2e6', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-control flex-grow-1"
                      value={settings.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                    />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Secondary Color</label>
                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="color"
                      className="form-control form-control-color flex-shrink-0"
                      value={settings.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      style={{ width: 'clamp(50px, 12vw, 60px)', height: 'clamp(35px, 8vw, 40px)', borderRadius: '8px', border: '1px solid #dee2e6', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-control flex-grow-1"
                      value={settings.secondaryColor}
                      onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                      style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                    />
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Theme</label>
                  <select
                    className="form-select"
                    value={settings.theme}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                    style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>
                <div className="col-12">
                  <div className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                    <input
                      className="form-check-input me-2 me-md-3 flex-shrink-0"
                      type="checkbox"
                      checked={settings.twoFactorAuth}
                      onChange={() => handleToggle('twoFactorAuth')}
                      style={{ width: 'clamp(2.5rem, 6vw, 3rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)', cursor: 'pointer' }}
                    />
                    <div className="flex-grow-1">
                      <label className="form-check-label fw-semibold mb-0" style={{ cursor: 'pointer', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                        Enable Two-Factor Authentication
                      </label>
                      <small className="d-block text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Require 2FA for admin accounts</small>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
                    min="5"
                    max="1440"
                    style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Password Min Length</label>
                  <input
                    type="number"
                    className="form-control"
                    value={settings.passwordMinLength}
                    onChange={(e) => handleInputChange('passwordMinLength', e.target.value)}
                    min="6"
                    max="32"
                    style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Settings Card */}
        <div className="col-12">
          <div
            className="card"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 240, 0.95) 100%)',
              border: '1px solid rgba(255, 140, 0, 0.2)',
              boxShadow: '0 4px 20px rgba(255, 140, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 140, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 140, 0, 0.1)';
            }}
          >
            <div className="card-header border-bottom px-3 px-md-4 py-3" style={{ background: 'transparent' }}>
              <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
                <span className="me-2">🖥️</span>
                System Settings
              </h5>
            </div>
            <div className="card-body p-3 p-md-4">
              <div className="row g-3">
                <div className="col-12">
                  <div className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded mb-3" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                    <input
                      className="form-check-input me-2 me-md-3 flex-shrink-0"
                      type="checkbox"
                      checked={settings.enableAnalytics}
                      onChange={() => handleToggle('enableAnalytics')}
                      style={{ width: 'clamp(2.5rem, 6vw, 3rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)', cursor: 'pointer' }}
                    />
                    <div className="flex-grow-1">
                      <label className="form-check-label fw-semibold mb-0" style={{ cursor: 'pointer', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                        Enable Analytics
                      </label>
                      <small className="d-block text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Track user behavior and platform usage</small>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <div className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                    <input
                      className="form-check-input me-2 me-md-3 flex-shrink-0"
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={() => handleToggle('maintenanceMode')}
                      style={{ width: 'clamp(2.5rem, 6vw, 3rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)', cursor: 'pointer' }}
                    />
                    <div className="flex-grow-1">
                      <label className="form-check-label fw-semibold mb-0" style={{ cursor: 'pointer', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                        Maintenance Mode
                      </label>
                      <small className="d-block text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Put the site in maintenance mode (only admins can access)</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-footer border-top px-3 px-md-4 py-3 d-flex flex-column flex-sm-row justify-content-end gap-2" style={{ background: 'transparent' }}>
              <button
                className="btn"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(1rem, 3vw, 1.5rem)',
                  fontWeight: '600',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  width: '100%',
                  maxWidth: '200px'
                }}
              >
                {saving ? 'Saving...' : 'Save All Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
