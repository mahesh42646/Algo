'use client';

import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '@/utils/api';
import { getAuthToken } from '@/utils/auth';

const emptyStrategy = (type, order) => ({
  name: '',
  type,
  description: '',
  maxLossPerTrade: 3,
  maxLossOverall: 3,
  maxProfitBook: 3,
  amountPerLevel: 10,
  numberOfLevels: 10,
  isDefault: type === 'admin',
  isPopular: type === 'popular',
  order,
});

export default function AppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    appName: 'AlgoBot',
    appIconUrl: '',
    theme: 'system',
    language: 'en',
    platformChargeType: 'percent',
    platformChargeValue: 0.3,
    adminStrategies: Array.from({ length: 5 }, (_, i) => emptyStrategy('admin', i)),
    popularStrategies: Array.from({ length: 5 }, (_, i) => emptyStrategy('popular', i)),
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError('Please log in again.');
        setLoading(false);
        return;
      }
      const res = await adminAPI.getAppSettings(token);
      if (res.success && res.data) {
        const d = res.data;
        setForm(prev => ({
          ...prev,
          appName: d.appName ?? 'AlgoBot',
          appIconUrl: d.appIconUrl ?? '',
          theme: d.theme ?? 'system',
          language: d.language ?? 'en',
          platformChargeType: d.platformChargeType ?? 'percent',
          platformChargeValue: d.platformChargeValue ?? 0.3,
          adminStrategies: Array.isArray(d.adminStrategies) && d.adminStrategies.length > 0
            ? [...d.adminStrategies.slice(0, 5), ...Array(Math.max(0, 5 - d.adminStrategies.length)).fill(null)].slice(0, 5).map((s, i) => s ? { ...s, order: i } : emptyStrategy('admin', i))
            : prev.adminStrategies,
          popularStrategies: Array.isArray(d.popularStrategies) && d.popularStrategies.length > 0
            ? [...d.popularStrategies.slice(0, 5), ...Array(Math.max(0, 5 - d.popularStrategies.length)).fill(null)].slice(0, 5).map((s, i) => s ? { ...s, order: i } : emptyStrategy('popular', i))
            : prev.popularStrategies,
        }));
      }
    } catch (e) {
      setError(e.message || 'Failed to load app settings');
    } finally {
      setLoading(false);
    }
  };

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError(null);
  };

  const updateStrategy = (which, index, field, value) => {
    setForm(prev => {
      const arr = [...(prev[which] || [])];
      if (!arr[index]) arr[index] = emptyStrategy(which === 'adminStrategies' ? 'admin' : 'popular', index);
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [which]: arr };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const token = getAuthToken();
      if (!token) {
        setError('Please log in again.');
        setSaving(false);
        return;
      }
      await adminAPI.updateAppSettings(token, {
        appName: form.appName,
        appIconUrl: form.appIconUrl,
        theme: form.theme,
        language: form.language,
        platformChargeType: form.platformChargeType,
        platformChargeValue: Number(form.platformChargeValue),
        adminStrategies: form.adminStrategies.map((s, i) => ({ ...s, order: i })),
        popularStrategies: form.popularStrategies.map((s, i) => ({ ...s, order: i })),
      });
      setSuccess('App settings saved.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleIconChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError('Please log in again.');
        setUploading(false);
        return;
      }
      const res = await adminAPI.uploadAppIcon(token, file);
      if (res.success && res.data?.appIconUrl) {
        update('appIconUrl', res.data.appIconUrl);
        setSuccess('App icon uploaded. Click Save to apply.');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Loading app settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 px-md-3 px-lg-4" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3 mb-md-4 gap-3">
        <div>
          <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>App Settings</h2>
          <p className="text-muted mb-0 small">Manage app name, icon, theme, language, platform charges, and strategies</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert" style={{ borderRadius: '12px' }}>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close" />
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show mb-3" role="alert" style={{ borderRadius: '12px' }}>
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess(null)} aria-label="Close" />
        </div>
      )}

      {/* App settings */}
      <div className="card mb-4" style={{ borderRadius: '16px', border: '1px solid rgba(255, 140, 0, 0.2)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div className="card-header py-3" style={{ background: 'rgba(255, 140, 0, 0.08)', borderBottom: '1px solid rgba(255, 140, 0, 0.2)' }}>
          <h5 className="mb-0 fw-bold">App configuration</h5>
        </div>
        <div className="card-body p-3 p-md-4">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">App name</label>
              <input
                type="text"
                className="form-control"
                value={form.appName}
                onChange={(e) => update('appName', e.target.value)}
                placeholder="AlgoBot"
                maxLength={100}
                style={{ borderRadius: '8px' }}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Theme</label>
              <select
                className="form-select"
                value={form.theme}
                onChange={(e) => update('theme', e.target.value)}
                style={{ borderRadius: '8px' }}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Language</label>
              <select
                className="form-select"
                value={form.language}
                onChange={(e) => update('language', e.target.value)}
                style={{ borderRadius: '8px' }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Platform charge type</label>
              <select
                className="form-select"
                value={form.platformChargeType}
                onChange={(e) => update('platformChargeType', e.target.value)}
                style={{ borderRadius: '8px' }}
              >
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat (fixed amount)</option>
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">Platform charge value</label>
              <input
                type="number"
                className="form-control"
                value={form.platformChargeValue}
                onChange={(e) => update('platformChargeValue', e.target.value)}
                min={0}
                step={form.platformChargeType === 'percent' ? 0.1 : 1}
                style={{ borderRadius: '8px' }}
              />
              <small className="text-muted">{form.platformChargeType === 'percent' ? 'e.g. 0.3 for 0.3%' : 'e.g. 1 for $1'}</small>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label fw-semibold">App icon</label>
              <div className="d-flex align-items-center gap-3 flex-wrap">
                {form.appIconUrl && (
                  <img src={form.appIconUrl} alt="App icon" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 12, border: '1px solid #dee2e6' }} />
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.ico"
                    onChange={handleIconChange}
                    className="form-control form-control-sm"
                    style={{ maxWidth: 220 }}
                  />
                  {uploading && <span className="small text-muted ms-2">Uploading...</span>}
                </div>
              </div>
              <small className="text-muted d-block mt-1">Used for iOS, Android and app branding. PNG, JPG, ICO recommended.</small>
            </div>
          </div>
        </div>
      </div>

      {/* Admin strategies */}
      <div className="card mb-4" style={{ borderRadius: '16px', border: '1px solid rgba(255, 140, 0, 0.2)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div className="card-header py-3" style={{ background: 'rgba(255, 140, 0, 0.08)', borderBottom: '1px solid rgba(255, 140, 0, 0.2)' }}>
          <h5 className="mb-0 fw-bold">Admin strategies (5)</h5>
        </div>
        <div className="card-body p-3 p-md-4">
          {(form.adminStrategies || []).slice(0, 5).map((s, i) => (
            <div key={`admin-${i}`} className="border rounded p-3 mb-3" style={{ background: 'rgba(0,0,0,0.02)' }}>
              <h6 className="mb-2">Strategy {i + 1}</h6>
              <div className="row g-2">
                <div className="col-12"><input className="form-control form-control-sm" placeholder="Name" value={s?.name ?? ''} onChange={(e) => updateStrategy('adminStrategies', i, 'name', e.target.value)} /></div>
                <div className="col-12"><input className="form-control form-control-sm" placeholder="Description" value={s?.description ?? ''} onChange={(e) => updateStrategy('adminStrategies', i, 'description', e.target.value)} /></div>
                <div className="col-6 col-md"><input type="number" step={0.5} className="form-control form-control-sm" placeholder="Max loss %" value={s?.maxLossPerTrade ?? ''} onChange={(e) => updateStrategy('adminStrategies', i, 'maxLossPerTrade', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-6 col-md"><input type="number" step={0.5} className="form-control form-control-sm" placeholder="Max loss overall %" value={s?.maxLossOverall ?? ''} onChange={(e) => updateStrategy('adminStrategies', i, 'maxLossOverall', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-6 col-md"><input type="number" step={0.5} className="form-control form-control-sm" placeholder="Profit target %" value={s?.maxProfitBook ?? ''} onChange={(e) => updateStrategy('adminStrategies', i, 'maxProfitBook', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-6 col-md"><input type="number" step={1} className="form-control form-control-sm" placeholder="Amount/level" value={s?.amountPerLevel ?? ''} onChange={(e) => updateStrategy('adminStrategies', i, 'amountPerLevel', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-6 col-md"><input type="number" className="form-control form-control-sm" placeholder="Levels" value={s?.numberOfLevels ?? ''} onChange={(e) => updateStrategy('adminStrategies', i, 'numberOfLevels', parseInt(e.target.value, 10) || 0)} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular strategies */}
      <div className="card mb-4" style={{ borderRadius: '16px', border: '1px solid rgba(255, 140, 0, 0.2)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <div className="card-header py-3" style={{ background: 'rgba(255, 140, 0, 0.08)', borderBottom: '1px solid rgba(255, 140, 0, 0.2)' }}>
          <h5 className="mb-0 fw-bold">Popular strategies (5)</h5>
        </div>
        <div className="card-body p-3 p-md-4">
          {(form.popularStrategies || []).slice(0, 5).map((s, i) => (
            <div key={`pop-${i}`} className="border rounded p-3 mb-3" style={{ background: 'rgba(0,0,0,0.02)' }}>
              <h6 className="mb-2">Strategy {i + 1}</h6>
              <div className="row g-2">
                <div className="col-12"><input className="form-control form-control-sm" placeholder="Name" value={s?.name ?? ''} onChange={(e) => updateStrategy('popularStrategies', i, 'name', e.target.value)} /></div>
                <div className="col-12"><input className="form-control form-control-sm" placeholder="Description" value={s?.description ?? ''} onChange={(e) => updateStrategy('popularStrategies', i, 'description', e.target.value)} /></div>
                <div className="col-6 col-md"><input type="number" step={0.5} className="form-control form-control-sm" placeholder="Max loss %" value={s?.maxLossPerTrade ?? ''} onChange={(e) => updateStrategy('popularStrategies', i, 'maxLossPerTrade', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-6 col-md"><input type="number" step={0.5} className="form-control form-control-sm" placeholder="Max loss overall %" value={s?.maxLossOverall ?? ''} onChange={(e) => updateStrategy('popularStrategies', i, 'maxLossOverall', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-6 col-md"><input type="number" step={0.5} className="form-control form-control-sm" placeholder="Profit target %" value={s?.maxProfitBook ?? ''} onChange={(e) => updateStrategy('popularStrategies', i, 'maxProfitBook', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-6 col-md"><input type="number" step={1} className="form-control form-control-sm" placeholder="Amount/level" value={s?.amountPerLevel ?? ''} onChange={(e) => updateStrategy('popularStrategies', i, 'amountPerLevel', parseFloat(e.target.value) || 0)} /></div>
                <div className="col-6 col-md"><input type="number" className="form-control form-control-sm" placeholder="Levels" value={s?.numberOfLevels ?? ''} onChange={(e) => updateStrategy('popularStrategies', i, 'numberOfLevels', parseInt(e.target.value, 10) || 0)} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="d-flex justify-content-end mb-4">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)', border: 'none', borderRadius: '10px', padding: '0.6rem 1.5rem', fontWeight: 600 }}
        >
          {saving ? 'Saving...' : 'Save all settings'}
        </button>
      </div>
    </div>
  );
}
