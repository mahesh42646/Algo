'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { referralsAPI } from '@/utils/api';

export default function Referrals() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referralsData, setReferralsData] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    totalReferrers: 0,
  });

  useEffect(() => {
    const fetchReferralsData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [referralsResponse, statsResponse] = await Promise.all([
          referralsAPI.getAll(),
          referralsAPI.getStats(),
        ]);

        if (referralsResponse.success) {
          setReferralsData(referralsResponse.data || []);
        } else {
          setError(referralsResponse.error || 'Failed to load referrals');
        }

        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (err) {
        console.error('Error fetching referrals:', err);
        setError(err.message || 'Failed to load referrals data');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralsData();
  }, []);

  const tableData = useMemo(() => {
    return referralsData.map(ref => ({
      id: ref.id,
      referrer: {
        id: ref.referrerId,
        name: ref.referrerName,
        email: ref.referrerEmail,
        plan: 'Pro', // You can map this from user data if needed
      },
      referredName: ref.referredUserName,
      referredEmail: ref.referredUserEmail,
      referredPlan: 'Basic', // You can map this from user data if needed
      status: ref.status,
      joinDate: ref.referredAt ? new Date(ref.referredAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      income: 0, // Calculate based on your business logic
      referralCode: ref.referralCode,
    }));
  }, [referralsData]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return tableData;
    const term = searchTerm.toLowerCase();
    return tableData.filter(row =>
      row.referrer.name.toLowerCase().includes(term) ||
      row.referrer.email.toLowerCase().includes(term) ||
      row.referredName.toLowerCase().includes(term) ||
      row.referredEmail.toLowerCase().includes(term) ||
      row.referralCode?.toLowerCase().includes(term)
    );
  }, [tableData, searchTerm]);

  const totalReferrals = stats.total || tableData.length;
  const totalEarnings = tableData.reduce((sum, row) => sum + (row.income || 0), 0);
  const activeReferrals = stats.active || tableData.filter(row => row.status === 'Active').length;
  const uniqueReferrers = stats.totalReferrers || new Set(tableData.map(row => row.referrer.id)).size;

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
      'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)',
      'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];
    return colors[name.length % colors.length];
  };

  if (loading) {
    return (
      <div className="px-2 px-md-3 px-lg-4 d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading referrals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-2 px-md-3 px-lg-4">
        <div className="alert alert-warning" role="alert" style={{ borderRadius: '12px' }}>
          <strong>Warning:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-primary ms-3" 
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 px-md-3 px-lg-4" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mb-md-4 gap-3">
        <div className="w-100 w-md-auto">
          <div className="d-flex align-items-center mb-2">
            <div
              className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-md-none">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2z"/>
              </svg>
            </div>
            <div>
              <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>Referrals</h2>
              <p className="text-muted mb-0 small d-none d-md-block">Track referral relationships and earnings</p>
            </div>
          </div>
        </div>
        <div className="w-100 w-md-auto" style={{ maxWidth: '100%' }}>
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--accent)" viewBox="0 0 16 16" className="d-md-none">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="var(--accent)" viewBox="0 0 16 16" className="d-none d-md-block">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search referrals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}
            />
          </div>
        </div>
      </div>

      <div className="row g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid rgba(255, 140, 0, 0.3)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 140, 0, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 140, 0, 0.3)';
            }}
          >
            <div className="card-body p-2 p-md-3 p-lg-4">
              <div className="d-flex justify-content-between align-items-start mb-2 mb-md-3">
                <div
                  style={{
                    width: 'clamp(36px, 9vw, 48px)',
                    height: 'clamp(36px, 9vw, 48px)',
                    borderRadius: 'clamp(8px, 2vw, 12px)',
                    background: 'rgba(255, 140, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="clamp(18px, 4.5vw, 24px)" height="clamp(18px, 4.5vw, 24px)" fill="#ff8c00" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2', color: '#1a202c' }}>{totalReferrals}</h3>
              <p className="mb-0 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)', color: '#718096' }}>Total Referrals</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card border-0 text-white h-100"
            style={{
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(67, 233, 123, 0.3)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(67, 233, 123, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(67, 233, 123, 0.3)';
            }}
          >
            <div
              className="d-none d-md-block"
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)'
              }}
            />
            <div className="card-body p-2 p-md-3 p-lg-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-2 mb-md-3">
                <div
                  style={{
                    width: 'clamp(36px, 9vw, 48px)',
                    height: 'clamp(36px, 9vw, 48px)',
                    borderRadius: 'clamp(8px, 2vw, 12px)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="clamp(18px, 4.5vw, 24px)" height="clamp(18px, 4.5vw, 24px)" fill="white" viewBox="0 0 16 16">
                    <path d="M4 10.781c.148 1.667 1.857 3.219 4.219 3.219 1.472 0 2.828-.655 3.735-1.48-.653-1.154-1.622-2.03-2.735-2.53-.57-.25-1.17-.471-1.818-.708v2.194c-.376.197-.804.293-1.184.293a2.22 2.22 0 0 1-1.218-.5v-1.351c0-.98-.486-1.855-1.218-2.358a3.15 3.15 0 0 0-1.085-.54l-.52-.103a2.144 2.144 0 0 0-.434-.041 3.734 3.734 0 0 1 .23-1.841c.229-.558.56-1.007.992-1.346.434-.34-.903-.272-1.926-.272l-.84.008c-1.194.047-2.466.18-3.23.958C.956 4.766-.499 6.888.891 8.962c.232.434.533.853.95 1.222l.257.229c1.041.924 1.772 1.757 2.693 2.654 1.193.955 3.23 1.882 4.859.996.54-.294 1.018-.66 1.469-1.043l.146-.125c.585-.48 1.292-.99 1.846-1.384.277-.197.583-.4.767-.545Z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>${totalEarnings}</h3>
              <p className="mb-0 opacity-90 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Total Earnings</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card border-0 text-white h-100"
            style={{
              background: 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(255, 140, 0, 0.4)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 140, 0, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 140, 0, 0.4)';
            }}
          >
            <div
              className="d-none d-md-block"
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)'
              }}
            />
            <div className="card-body p-2 p-md-3 p-lg-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-2 mb-md-3">
                <div
                  style={{
                    width: 'clamp(36px, 9vw, 48px)',
                    height: 'clamp(36px, 9vw, 48px)',
                    borderRadius: 'clamp(8px, 2vw, 12px)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="clamp(18px, 4.5vw, 24px)" height="clamp(18px, 4.5vw, 24px)" fill="white" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{activeReferrals}</h3>
              <p className="mb-0 opacity-90 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Active Referrals</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card border-0 text-white h-100"
            style={{
              background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 102, 204, 0.4)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 102, 204, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 102, 204, 0.4)';
            }}
          >
            <div
              className="d-none d-md-block"
              style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)'
              }}
            />
            <div className="card-body p-2 p-md-3 p-lg-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-2 mb-md-3">
                <div
                  style={{
                    width: 'clamp(36px, 9vw, 48px)',
                    height: 'clamp(36px, 9vw, 48px)',
                    borderRadius: 'clamp(8px, 2vw, 12px)',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="clamp(18px, 4.5vw, 24px)" height="clamp(18px, 4.5vw, 24px)" fill="white" viewBox="0 0 16 16">
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{uniqueReferrers}</h3>
              <p className="mb-0 opacity-90 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Active Referrers</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="card border-0"
        style={{
          boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
          borderRadius: '16px',
          overflow: 'hidden'
        }}
      >
        <div className="card-header bg-white border-bottom px-3 px-md-4 py-2 py-md-3">
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
            <div className="d-flex align-items-center w-100 w-md-auto">
              <div
                className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                  boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16" className="d-md-none">
                  <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                  <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
                </svg>
              </div>
              <div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Referral Records</h5>
                <small className="text-muted d-none d-md-inline">{filteredData.length} {filteredData.length === 1 ? 'record' : 'records'} found</small>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="d-md-none p-3">
          {filteredData.length > 0 ? (
            <div className="d-flex flex-column gap-3">
              {filteredData.map((row, index) => (
                <div
                  key={index}
                  className="card border-0"
                  style={{
                    borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                  }}
                >
                  <div
                    className="p-3 text-white"
                    style={{
                      background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                      borderRadius: '16px 16px 0 0'
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center">
                        <div
                          className="d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.25)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16">
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                            <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="fw-bold" style={{ fontSize: '1rem' }}>Referral #{index + 1}</div>
                          <div className="opacity-90" style={{ fontSize: '0.85rem' }}>{row.joinDate}</div>
                        </div>
                      </div>
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.25)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                      >
                        <span className="fw-bold" style={{ fontSize: '1.25rem' }}>${row.income}</span>
                      </div>
                    </div>
                  </div>

                  <div className="card-body p-3">
                    <div className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-center mb-2">
                        <div
                          className="d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: getAvatarColor(row.referrer.name),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        >
                          {getInitials(row.referrer.name)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted small mb-1">Referrer</div>
                          <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{row.referrer.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{row.referrer.email}</div>
                        </div>
                      </div>
                    </div>

                    <div className="mb-3 pb-3 border-bottom">
                      <div className="d-flex align-items-center mb-2">
                        <div
                          className="d-flex align-items-center justify-content-center me-3"
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: getAvatarColor(row.referredName),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        >
                          {getInitials(row.referredName)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted small mb-1">Referred User</div>
                          <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{row.referredName}</div>
                          <div className="text-muted" style={{ fontSize: '0.8rem' }}>{row.referredEmail}</div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <div className="p-2 rounded" style={{ background: 'rgba(255, 140, 0, 0.08)' }}>
                          <div className="text-muted small mb-1">Plan</div>
                          <span
                            className={`badge ${
                              row.referredPlan === 'Premium'
                                ? 'bg-danger'
                                : row.referredPlan === 'Pro'
                                ? 'bg-primary'
                                : 'bg-secondary'
                            }`}
                            style={{
                              fontSize: '0.8rem',
                              padding: '0.4rem 0.7rem',
                              borderRadius: '6px',
                              fontWeight: '600'
                            }}
                          >
                            {row.referredPlan}
                          </span>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded" style={{ background: 'rgba(255, 140, 0, 0.08)' }}>
                          <div className="text-muted small mb-1">Status</div>
                          <div className="d-flex align-items-center">
                            <div
                              className="me-2"
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: row.status === 'Active' ? '#28a745' : '#6c757d'
                              }}
                            />
                            <span
                              className={`badge ${
                                row.status === 'Active' ? 'bg-success' : 'bg-secondary'
                              }`}
                              style={{
                                fontSize: '0.8rem',
                                padding: '0.4rem 0.7rem',
                                borderRadius: '6px',
                                fontWeight: '600'
                              }}
                            >
                              {row.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        className="btn flex-fill d-flex align-items-center justify-content-center"
                        style={{
                          background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.6rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => router.push(`/admin/dashboard/users/${row.referrer.id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 0, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 140, 0, 0.3)';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                        </svg>
                        Referrer
                      </button>
                      <button
                        className="btn flex-fill d-flex align-items-center justify-content-center"
                        style={{
                          background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '0.6rem 1rem',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          boxShadow: '0 2px 8px rgba(0, 102, 204, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => router.push(`/admin/dashboard/users/${row.id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 102, 204, 0.3)';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                        </svg>
                        User
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="var(--light-gray)" viewBox="0 0 16 16" className="mb-3">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2z"/>
              </svg>
              <h5 className="text-muted mb-2">No referrals found</h5>
              <p className="text-muted small mb-0">Try adjusting your search criteria</p>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="card-body p-0 d-none d-md-block">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead>
                <tr style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                  <th className="px-3 px-lg-4 py-3 fw-semibold text-muted" style={{ fontSize: '0.875rem', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Referrer</th>
                  <th className="px-3 px-lg-4 py-3 fw-semibold text-muted" style={{ fontSize: '0.875rem', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Referred User</th>
                  <th className="px-3 px-lg-4 py-3 fw-semibold text-muted" style={{ fontSize: '0.875rem', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Plan</th>
                  <th className="px-3 px-lg-4 py-3 fw-semibold text-muted" style={{ fontSize: '0.875rem', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Status</th>
                  <th className="px-3 px-lg-4 py-3 fw-semibold text-muted" style={{ fontSize: '0.875rem', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Join Date</th>
                  <th className="px-3 px-lg-4 py-3 fw-semibold text-muted" style={{ fontSize: '0.875rem', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Income</th>
                  <th className="px-3 px-lg-4 py-3 fw-semibold text-muted text-center" style={{ fontSize: '0.875rem', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr
                      key={index}
                      style={{
                        transition: 'all 0.3s ease',
                        borderBottom: '1px solid rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 140, 0, 0.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-3 px-lg-4 py-3">
                        <div className="d-flex align-items-center">
                          <div
                            className="d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: getAvatarColor(row.referrer.name),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                          >
                            {getInitials(row.referrer.name)}
                          </div>
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.95rem' }}>{row.referrer.name}</div>
                            <small className="text-muted">{row.referrer.email}</small>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 px-lg-4 py-3">
                        <div className="d-flex align-items-center">
                          <div
                            className="d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '10px',
                              background: getAvatarColor(row.referredName),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                          >
                            {getInitials(row.referredName)}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ fontSize: '0.95rem' }}>{row.referredName}</div>
                            <small className="text-muted">{row.referredEmail}</small>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 px-lg-4 py-3">
                        <span
                          className={`badge ${
                            row.referredPlan === 'Premium'
                              ? 'bg-danger'
                              : row.referredPlan === 'Pro'
                              ? 'bg-primary'
                              : 'bg-secondary'
                          }`}
                          style={{
                            fontSize: '0.85rem',
                            padding: '0.5rem 0.9rem',
                            borderRadius: '8px',
                            fontWeight: '600'
                          }}
                        >
                          {row.referredPlan}
                        </span>
                      </td>
                      <td className="px-3 px-lg-4 py-3">
                        <div className="d-flex align-items-center">
                          <div
                            className="me-2"
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: row.status === 'Active' ? '#28a745' : '#6c757d'
                            }}
                          />
                          <span
                            className={`badge ${
                              row.status === 'Active' ? 'bg-success' : 'bg-secondary'
                            }`}
                            style={{
                              fontSize: '0.85rem',
                              padding: '0.5rem 0.9rem',
                              borderRadius: '8px',
                              fontWeight: '600'
                            }}
                          >
                            {row.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 px-lg-4 py-3">
                        <div className="d-flex align-items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="var(--accent)" viewBox="0 0 16 16" className="me-2">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                          </svg>
                          <span style={{ fontSize: '0.9rem' }}>{row.joinDate}</span>
                        </div>
                      </td>
                      <td className="px-3 px-lg-4 py-3">
                        <div className="d-flex align-items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#28a745" viewBox="0 0 16 16" className="me-2">
                            <path d="M4 10.781c.148 1.667 1.857 3.219 4.219 3.219 1.472 0 2.828-.655 3.735-1.48-.653-1.154-1.622-2.03-2.735-2.53-.57-.25-1.17-.471-1.818-.708v2.194c-.376.197-.804.293-1.184.293a2.22 2.22 0 0 1-1.218-.5v-1.351c0-.98-.486-1.855-1.218-2.358a3.15 3.15 0 0 0-1.085-.54l-.52-.103a2.144 2.144 0 0 0-.434-.041 3.734 3.734 0 0 1 .23-1.841c.229-.558.56-1.007.992-1.346.434-.34-.903-.272-1.926-.272l-.84.008c-1.194.047-2.466.18-3.23.958C.956 4.766-.499 6.888.891 8.962c.232.434.533.853.95 1.222l.257.229c1.041.924 1.772 1.757 2.693 2.654 1.193.955 3.23 1.882 4.859.996.54-.294 1.018-.66 1.469-1.043l.146-.125c.585-.48 1.292-.99 1.846-1.384.277-.197.583-.4.767-.545Z"/>
                          </svg>
                          <span className="fw-bold" style={{ color: '#28a745', fontSize: '0.95rem' }}>${row.income}</span>
                        </div>
                      </td>
                      <td className="px-3 px-lg-4 py-3 text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <button
                            className="btn btn-sm d-inline-flex align-items-center justify-content-center"
                            style={{
                              background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.4rem 0.9rem',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)'
                            }}
                            onClick={() => router.push(`/admin/dashboard/users/${row.referrer.id}`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 0, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 140, 0, 0.3)';
                            }}
                            title="View Referrer Profile"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                            </svg>
                            Referrer
                          </button>
                          <button
                            className="btn btn-sm d-inline-flex align-items-center justify-content-center"
                            style={{
                              background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.4rem 0.9rem',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 8px rgba(0, 102, 204, 0.3)'
                            }}
                            onClick={() => router.push(`/admin/dashboard/users/${row.id}`)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 102, 204, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0) scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 102, 204, 0.3)';
                            }}
                            title="View Referred User Profile"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                            </svg>
                            User
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5">
                      <div className="py-5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="var(--light-gray)" viewBox="0 0 16 16" className="mb-3">
                          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                          <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2z"/>
                        </svg>
                        <h5 className="text-muted mb-2">No referrals found</h5>
                        <p className="text-muted small mb-0">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
