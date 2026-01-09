'use client';

import { useState, useEffect } from 'react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const [settings, setSettings] = useState({
    general: {
      siteName: 'Algo Platform',
      siteDescription: 'Advanced algorithm and analytics platform',
      siteUrl: 'https://algo-platform.com',
      adminEmail: 'admin@algo-platform.com',
      supportEmail: 'support@algo-platform.com',
      timezone: 'UTC',
      language: 'en',
      logo: '',
      favicon: ''
    },
    email: {
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      smtpEncryption: 'tls',
      fromName: 'Algo Platform',
      fromEmail: 'noreply@algo-platform.com',
      emailNotifications: true
    },
    security: {
      twoFactorAuth: true,
      sessionTimeout: '30',
      passwordMinLength: '8',
      requireStrongPassword: true,
      loginAttempts: '5',
      lockoutDuration: '15',
      enableIpWhitelist: false,
      allowedIPs: []
    },
    notifications: {
      newUserRegistration: true,
      paymentReceived: true,
      paymentFailed: true,
      subscriptionExpiring: true,
      systemAlerts: true,
      emailNotifications: true,
      pushNotifications: false,
      smsNotifications: false
    },
    payment: {
      currency: 'USD',
      paymentGateway: 'stripe',
      stripePublicKey: '',
      stripeSecretKey: '',
      paypalClientId: '',
      paypalSecret: '',
      enableTestMode: false,
      autoRenewal: true,
      refundPolicy: '7'
    },
    appearance: {
      primaryColor: '#ff8c00',
      secondaryColor: '#0066cc',
      theme: 'light',
      fontFamily: 'Inter',
      fontSize: 'medium',
      enableDarkMode: false
    },
    system: {
      maintenanceMode: false,
      maintenanceMessage: 'We are currently performing maintenance. Please check back soon.',
      enableAnalytics: true,
      analyticsId: '',
      enableLogging: true,
      logLevel: 'info',
      backupFrequency: 'daily',
      lastBackup: '2024-01-20 10:00:00'
    }
  });

  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 992);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const handleInputChange = (section, field, value) => {
    setTempSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleToggle = (section, field) => {
    setTempSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: !prev[section][field]
      }
    }));
  };

  const handleSave = async (section) => {
    setSaving(true);
    setSaveMessage(null);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSettings(prev => ({
      ...prev,
      [section]: tempSettings[section]
    }));

    setSaving(false);
    setSaveMessage({ type: 'success', text: `${section.charAt(0).toUpperCase() + section.slice(1)} settings saved successfully!` });

    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleReset = (section) => {
    if (confirm(`Are you sure you want to reset ${section} settings to default?`)) {
      setTempSettings(prev => ({
        ...prev,
        [section]: settings[section]
      }));
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'system', label: 'System', icon: '🖥️' }
  ];

  const renderGeneralSettings = () => (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
      <div className="card-header bg-white border-bottom px-3 px-md-4 py-3">
        <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
          <span className="me-2" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>⚙️</span>
          General Settings
        </h5>
        <small className="text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Configure basic platform information and preferences</small>
      </div>
      <div className="card-body p-3 p-md-4">
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Site Name *</label>
            <input
              type="text"
              className="form-control"
              value={tempSettings.general.siteName}
              onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Site URL *</label>
            <input
              type="url"
              className="form-control"
              value={tempSettings.general.siteUrl}
              onChange={(e) => handleInputChange('general', 'siteUrl', e.target.value)}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            />
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Site Description</label>
            <textarea
              className="form-control"
              value={tempSettings.general.siteDescription}
              onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
              rows="3"
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', resize: 'vertical' }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Admin Email *</label>
            <input
              type="email"
              className="form-control"
              value={tempSettings.general.adminEmail}
              onChange={(e) => handleInputChange('general', 'adminEmail', e.target.value)}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Support Email *</label>
            <input
              type="email"
              className="form-control"
              value={tempSettings.general.supportEmail}
              onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Timezone</label>
            <select
              className="form-select"
              value={tempSettings.general.timezone}
              onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Language</label>
            <select
              className="form-select"
              value={tempSettings.general.language}
              onChange={(e) => handleInputChange('general', 'language', e.target.value)}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Logo URL</label>
            <input
              type="url"
              className="form-control"
              value={tempSettings.general.logo}
              onChange={(e) => handleInputChange('general', 'logo', e.target.value)}
              placeholder="https://example.com/logo.png"
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Favicon URL</label>
            <input
              type="url"
              className="form-control"
              value={tempSettings.general.favicon}
              onChange={(e) => handleInputChange('general', 'favicon', e.target.value)}
              placeholder="https://example.com/favicon.ico"
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            />
          </div>
        </div>
      </div>
      <div className="card-footer bg-white border-top px-3 px-md-4 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
        <button
          className="btn btn-outline-secondary"
          onClick={() => handleReset('general')}
          style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', width: '100%', maxWidth: '200px' }}
        >
          Reset
        </button>
        <button
          className="btn"
          onClick={() => handleSave('general')}
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
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
      <div className="card-header bg-white border-bottom px-3 px-md-4 py-3">
        <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
          <span className="me-2" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>🔒</span>
          Security Settings
        </h5>
        <small className="text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Configure security and authentication settings</small>
      </div>
      <div className="card-body p-3 p-md-4">
        <div className="row g-3">
          <div className="col-12">
            <div className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded mb-3" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
              <input
                className="form-check-input me-2 me-md-3 flex-shrink-0"
                type="checkbox"
                checked={tempSettings.security.twoFactorAuth}
                onChange={() => handleToggle('security', 'twoFactorAuth')}
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
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Session Timeout (minutes)</label>
            <input
              type="number"
              className="form-control"
              value={tempSettings.security.sessionTimeout}
              onChange={(e) => handleInputChange('security', 'sessionTimeout', e.target.value)}
              min="5"
              max="1440"
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Minimum Password Length</label>
            <input
              type="number"
              className="form-control"
              value={tempSettings.security.passwordMinLength}
              onChange={(e) => handleInputChange('security', 'passwordMinLength', e.target.value)}
              min="6"
              max="32"
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            />
          </div>
          <div className="col-12">
            <div className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded mb-3" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
              <input
                className="form-check-input me-2 me-md-3 flex-shrink-0"
                type="checkbox"
                checked={tempSettings.security.requireStrongPassword}
                onChange={() => handleToggle('security', 'requireStrongPassword')}
                style={{ width: 'clamp(2.5rem, 6vw, 3rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)', cursor: 'pointer' }}
              />
              <div className="flex-grow-1">
                <label className="form-check-label fw-semibold mb-0" style={{ cursor: 'pointer', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                  Require Strong Password
                </label>
                <small className="d-block text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Password must contain uppercase, lowercase, number, and special character</small>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Max Login Attempts</label>
            <input
              type="number"
              className="form-control"
              value={tempSettings.security.loginAttempts}
              onChange={(e) => handleInputChange('security', 'loginAttempts', e.target.value)}
              min="3"
              max="10"
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Lockout Duration (minutes)</label>
            <input
              type="number"
              className="form-control"
              value={tempSettings.security.lockoutDuration}
              onChange={(e) => handleInputChange('security', 'lockoutDuration', e.target.value)}
              min="5"
              max="60"
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            />
          </div>
          <div className="col-12">
            <div className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
              <input
                className="form-check-input me-2 me-md-3 flex-shrink-0"
                type="checkbox"
                checked={tempSettings.security.enableIpWhitelist}
                onChange={() => handleToggle('security', 'enableIpWhitelist')}
                style={{ width: 'clamp(2.5rem, 6vw, 3rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)', cursor: 'pointer' }}
              />
              <div className="flex-grow-1">
                <label className="form-check-label fw-semibold mb-0" style={{ cursor: 'pointer', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                  Enable IP Whitelist
                </label>
                <small className="d-block text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Restrict admin access to specific IP addresses</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-footer bg-white border-top px-3 px-md-4 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
        <button
          className="btn btn-outline-secondary"
          onClick={() => handleReset('security')}
          style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', width: '100%', maxWidth: '200px' }}
        >
          Reset
        </button>
        <button
          className="btn"
          onClick={() => handleSave('security')}
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
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
      <div className="card-header bg-white border-bottom px-3 px-md-4 py-3">
        <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
          <span className="me-2" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>🔔</span>
          Notification Settings
        </h5>
        <small className="text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Configure notification preferences</small>
      </div>
      <div className="card-body p-3 p-md-4">
        <div className="row g-3">
          <div className="col-12">
            <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)', fontSize: 'clamp(0.9rem, 2.2vw, 1rem)' }}>Event Notifications</h6>
            {[
              { key: 'newUserRegistration', label: 'New User Registration', desc: 'Notify when a new user registers' },
              { key: 'paymentReceived', label: 'Payment Received', desc: 'Notify when a payment is successfully processed' },
              { key: 'paymentFailed', label: 'Payment Failed', desc: 'Notify when a payment attempt fails' },
              { key: 'subscriptionExpiring', label: 'Subscription Expiring', desc: 'Notify when subscriptions are about to expire' },
              { key: 'systemAlerts', label: 'System Alerts', desc: 'Notify about critical system events' }
            ].map(item => (
              <div key={item.key} className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded mb-2" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                <input
                  className="form-check-input me-2 me-md-3 flex-shrink-0"
                  type="checkbox"
                  checked={tempSettings.notifications[item.key]}
                  onChange={() => handleToggle('notifications', item.key)}
                  style={{ width: 'clamp(2.5rem, 6vw, 3rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)', cursor: 'pointer' }}
                />
                <div className="flex-grow-1">
                  <label className="form-check-label fw-semibold mb-0" style={{ cursor: 'pointer', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                    {item.label}
                  </label>
                  <small className="d-block text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>{item.desc}</small>
                </div>
              </div>
            ))}
          </div>
          <div className="col-12 mt-3">
            <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)', fontSize: 'clamp(0.9rem, 2.2vw, 1rem)' }}>Notification Channels</h6>
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
              { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive browser push notifications' },
              { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS (requires SMS gateway)' }
            ].map(item => (
              <div key={item.key} className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded mb-2" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                <input
                  className="form-check-input me-2 me-md-3 flex-shrink-0"
                  type="checkbox"
                  checked={tempSettings.notifications[item.key]}
                  onChange={() => handleToggle('notifications', item.key)}
                  style={{ width: 'clamp(2.5rem, 6vw, 3rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)', cursor: 'pointer' }}
                />
                <div className="flex-grow-1">
                  <label className="form-check-label fw-semibold mb-0" style={{ cursor: 'pointer', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                    {item.label}
                  </label>
                  <small className="d-block text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>{item.desc}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card-footer bg-white border-top px-3 px-md-4 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
        <button
          className="btn btn-outline-secondary"
          onClick={() => handleReset('notifications')}
          style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', width: '100%', maxWidth: '200px' }}
        >
          Reset
        </button>
        <button
          className="btn"
          onClick={() => handleSave('notifications')}
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
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
      <div className="card-header bg-white border-bottom px-3 px-md-4 py-3">
        <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
          <span className="me-2" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>🎨</span>
          Appearance Settings
        </h5>
        <small className="text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Customize the look and feel of your platform</small>
      </div>
      <div className="card-body p-3 p-md-4">
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Primary Color</label>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <input
                type="color"
                className="form-control form-control-color flex-shrink-0"
                value={tempSettings.appearance.primaryColor}
                onChange={(e) => handleInputChange('appearance', 'primaryColor', e.target.value)}
                style={{ width: 'clamp(50px, 12vw, 60px)', height: 'clamp(35px, 8vw, 40px)', borderRadius: '8px', border: '1px solid #dee2e6', cursor: 'pointer' }}
              />
              <input
                type="text"
                className="form-control flex-grow-1"
                value={tempSettings.appearance.primaryColor}
                onChange={(e) => handleInputChange('appearance', 'primaryColor', e.target.value)}
                style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', minWidth: '120px' }}
              />
            </div>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Secondary Color</label>
            <div className="d-flex gap-2 align-items-center flex-wrap">
              <input
                type="color"
                className="form-control form-control-color flex-shrink-0"
                value={tempSettings.appearance.secondaryColor}
                onChange={(e) => handleInputChange('appearance', 'secondaryColor', e.target.value)}
                style={{ width: 'clamp(50px, 12vw, 60px)', height: 'clamp(35px, 8vw, 40px)', borderRadius: '8px', border: '1px solid #dee2e6', cursor: 'pointer' }}
              />
              <input
                type="text"
                className="form-control flex-grow-1"
                value={tempSettings.appearance.secondaryColor}
                onChange={(e) => handleInputChange('appearance', 'secondaryColor', e.target.value)}
                style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', minWidth: '120px' }}
              />
            </div>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Theme</label>
            <select
              className="form-select"
              value={tempSettings.appearance.theme}
              onChange={(e) => handleInputChange('appearance', 'theme', e.target.value)}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Font Family</label>
            <select
              className="form-select"
              value={tempSettings.appearance.fontFamily}
              onChange={(e) => handleInputChange('appearance', 'fontFamily', e.target.value)}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Open Sans">Open Sans</option>
              <option value="Lato">Lato</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Poppins">Poppins</option>
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Font Size</label>
            <select
              className="form-select"
              value={tempSettings.appearance.fontSize}
              onChange={(e) => handleInputChange('appearance', 'fontSize', e.target.value)}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div className="col-12">
            <div className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
              <input
                className="form-check-input me-2 me-md-3 flex-shrink-0"
                type="checkbox"
                checked={tempSettings.appearance.enableDarkMode}
                onChange={() => handleToggle('appearance', 'enableDarkMode')}
                style={{ width: 'clamp(2.5rem, 6vw, 3rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)', cursor: 'pointer' }}
              />
              <div className="flex-grow-1">
                <label className="form-check-label fw-semibold mb-0" style={{ cursor: 'pointer', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                  Enable Dark Mode
                </label>
                <small className="d-block text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Allow users to switch to dark mode</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-footer bg-white border-top px-3 px-md-4 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
        <button
          className="btn btn-outline-secondary"
          onClick={() => handleReset('appearance')}
          style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', width: '100%', maxWidth: '200px' }}
        >
          Reset
        </button>
        <button
          className="btn"
          onClick={() => handleSave('appearance')}
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
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
      <div className="card-header bg-white border-bottom px-3 px-md-4 py-3">
        <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
          <span className="me-2" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>🖥️</span>
          System Settings
        </h5>
        <small className="text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Configure system-level settings and maintenance</small>
      </div>
      <div className="card-body p-3 p-md-4">
        <div className="row g-3">
          <div className="col-12">
            <div className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded mb-3" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
              <input
                className="form-check-input me-2 me-md-3 flex-shrink-0"
                type="checkbox"
                checked={tempSettings.system.maintenanceMode}
                onChange={() => handleToggle('system', 'maintenanceMode')}
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
          {tempSettings.system.maintenanceMode && (
            <div className="col-12">
              <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Maintenance Message</label>
              <textarea
                className="form-control"
                value={tempSettings.system.maintenanceMessage}
                onChange={(e) => handleInputChange('system', 'maintenanceMessage', e.target.value)}
                rows="3"
                style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', resize: 'vertical' }}
              />
            </div>
          )}
          <div className="col-12">
            <div className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded mb-3" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
              <input
                className="form-check-input me-2 me-md-3 flex-shrink-0"
                type="checkbox"
                checked={tempSettings.system.enableAnalytics}
                onChange={() => handleToggle('system', 'enableAnalytics')}
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
          {tempSettings.system.enableAnalytics && (
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Analytics ID</label>
              <input
                type="text"
                className="form-control"
                value={tempSettings.system.analyticsId}
                onChange={(e) => handleInputChange('system', 'analyticsId', e.target.value)}
                placeholder="G-XXXXXXXXXX"
                style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
              />
            </div>
          )}
          <div className="col-12">
            <div className="form-check form-switch d-flex align-items-center p-2 p-md-3 rounded mb-3" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
              <input
                className="form-check-input me-2 me-md-3 flex-shrink-0"
                type="checkbox"
                checked={tempSettings.system.enableLogging}
                onChange={() => handleToggle('system', 'enableLogging')}
                style={{ width: 'clamp(2.5rem, 6vw, 3rem)', height: 'clamp(1.25rem, 3vw, 1.5rem)', cursor: 'pointer' }}
              />
              <div className="flex-grow-1">
                <label className="form-check-label fw-semibold mb-0" style={{ cursor: 'pointer', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                  Enable System Logging
                </label>
                <small className="d-block text-muted" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)' }}>Log system events and errors for debugging</small>
              </div>
            </div>
          </div>
          {tempSettings.system.enableLogging && (
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Log Level</label>
              <select
                className="form-select"
                value={tempSettings.system.logLevel}
                onChange={(e) => handleInputChange('system', 'logLevel', e.target.value)}
                style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
              >
                <option value="debug">Debug</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          )}
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Backup Frequency</label>
            <select
              className="form-select"
              value={tempSettings.system.backupFrequency}
              onChange={(e) => handleInputChange('system', 'backupFrequency', e.target.value)}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>Last Backup</label>
            <input
              type="text"
              className="form-control"
              value={tempSettings.system.lastBackup}
              readOnly
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', background: '#f8f9fa' }}
            />
          </div>
          <div className="col-12">
            <button
              className="btn btn-outline-primary w-100"
              onClick={() => alert('Backup initiated! This may take a few minutes.')}
              style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(0.875rem, 2.5vw, 1rem)', fontWeight: '600', fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5h2.5a.5.5 0 0 1 0 1H3a1 1 0 0 1-1-1V4.914a1 1 0 0 1 .293-.707L4.707.293A1 1 0 0 1 5.914 0H13a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-1.5a.5.5 0 0 1 0-1H13V1H5.914L3.5 3.414V9.4z"/>
                <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1h3V3.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M9.5 6.5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1h3V7a.5.5 0 0 1 .5-.5z"/>
              </svg>
              Create Manual Backup
            </button>
          </div>
        </div>
      </div>
      <div className="card-footer bg-white border-top px-3 px-md-4 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2">
        <button
          className="btn btn-outline-secondary"
          onClick={() => handleReset('system')}
          style={{ borderRadius: '8px', padding: 'clamp(0.5rem, 2vw, 0.6rem) clamp(1rem, 3vw, 1.5rem)', fontSize: 'clamp(0.875rem, 2vw, 1rem)', width: '100%', maxWidth: '200px' }}
        >
          Reset
        </button>
        <button
          className="btn"
          onClick={() => handleSave('system')}
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
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="px-2 px-md-3 px-lg-4 py-3 py-md-4" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', minHeight: '100vh' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 gap-3">
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
        <div className="col-12 col-lg-3">
          <div
            className="card border-0 shadow-sm"
            style={{
              borderRadius: '16px',
              position: isDesktop ? 'sticky' : 'relative',
              top: isDesktop ? '90px' : 'auto',
              maxHeight: isDesktop ? 'calc(100vh - 120px)' : 'none',
              overflowY: isDesktop ? 'auto' : 'visible'
            }}
          >
            <div className="card-body p-3 p-md-4">
              <h6 className="fw-bold mb-3 d-none d-lg-block" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)', color: 'var(--accent)' }}>
                Settings Categories
              </h6>
              <div className="d-flex flex-row flex-lg-column gap-2 overflow-x-auto pb-2 pb-lg-0" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin' }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`btn text-start d-flex align-items-center ${
                      activeTab === tab.id ? '' : 'btn-outline-'
                    }primary`}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      background: activeTab === tab.id
                        ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)'
                        : 'transparent',
                      color: activeTab === tab.id ? 'white' : '#4a5568',
                      border: activeTab === tab.id ? 'none' : '1px solid #dee2e6',
                      borderRadius: '10px',
                      padding: 'clamp(0.6rem, 2vw, 0.75rem) clamp(0.875rem, 2.5vw, 1rem)',
                      fontWeight: '600',
                      fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      minWidth: !isDesktop ? 'auto' : '100%',
                      width: !isDesktop ? 'auto' : '100%'
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.background = 'rgba(255, 140, 0, 0.1)';
                        e.currentTarget.style.borderColor = '#ff8c00';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== tab.id) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = '#dee2e6';
                      }
                    }}
                  >
                    <span className="me-2" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.1rem)', flexShrink: 0 }}>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-9">
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'appearance' && renderAppearanceSettings()}
          {activeTab === 'system' && renderSystemSettings()}
        </div>
      </div>
    </div>
  );
}

