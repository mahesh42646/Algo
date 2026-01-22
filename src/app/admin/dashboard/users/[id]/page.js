'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { usersAPI } from '@/utils/api';
import { useUserProfileData } from '@/hooks/useUserProfileData';

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [notificationSubTab, setNotificationSubTab] = useState('list');
  const [transactionFilter, setTransactionFilter] = useState('all');
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'info' });
  const [notifSubmitting, setNotifSubmitting] = useState(false);
  const [notifError, setNotifError] = useState(null);

  const userId = params?.id ? String(params.id) : null;
  const {
    loading,
    error,
    user,
    wallet,
    notifications,
    referrals,
    strategies,
    activities,
    refetch,
  } = useUserProfileData(userId, { ttlMs: 2 * 60 * 1000 });

  const unreadCount = useMemo(
    () => (Array.isArray(notifications) ? notifications.filter((n) => !n?.read).length : 0),
    [notifications]
  );

  const walletBalances = useMemo(() => (Array.isArray(wallet?.balances) ? wallet.balances : []), [wallet]);
  
  // Calculate USDT balance
  const usdtBalance = useMemo(() => {
    if (!Array.isArray(wallet?.balances)) return 0;
    const usdt = wallet.balances.find((b) => b?.currency?.toUpperCase() === 'USDT');
    return usdt?.amount || 0;
  }, [wallet]);

  // Filter transactions by type
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(wallet?.transactions)) return [];
    let transactions = wallet.transactions.slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (transactionFilter !== 'all') {
      transactions = transactions.filter((t) => t?.type === transactionFilter);
    }
    return transactions;
  }, [wallet, transactionFilter]);

  const tradeActivities = useMemo(
    () => (Array.isArray(activities) ? activities.filter((a) => a?.type === 'trade') : []),
    [activities]
  );

  const activeApiKeys = useMemo(
    () => (Array.isArray(user?.integrations) ? user.integrations.filter((k) => k?.isActive !== false).length : 0),
    [user]
  );

  const onCreateNotification = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setNotifError(null);
    setNotifSubmitting(true);
    try {
      const payload = {
        title: notifForm.title?.trim(),
        message: notifForm.message?.trim(),
        type: notifForm.type,
      };
      const resp = await usersAPI.createNotification(userId, payload);
      if (!resp?.success) throw new Error(resp?.error || 'Failed to create notification');
      setNotifForm({ title: '', message: '', type: 'info' });
      setNotificationSubTab('list');
      await refetch({ hard: true });
      } catch (err) {
      setNotifError(err?.message || 'Failed to create notification');
      } finally {
      setNotifSubmitting(false);
    }
  };

  const onMarkNotificationRead = async (notificationId) => {
    if (!userId || !notificationId) return;
    try {
      await usersAPI.markNotificationRead(userId, notificationId);
      await refetch({ hard: true });
    } catch {
      // keep UI stable; errors are shown in notification area if needed
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading user profile...</p>
      </div>
    );
  }

  if (error) {
    const isNetworkError = error.includes('Network error') || error.includes('Unable to connect');
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="alert alert-danger" role="alert" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h4 className="alert-heading">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="me-2">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            Error Loading User Profile
          </h4>
          <p className="mb-3">{error}</p>
          {isNetworkError && (
            <div className="alert alert-info mb-3">
              <strong>Backend Connection Issue:</strong>
              <ul className="mb-0 mt-2">
                <li>Ensure the backend server is running on port 4006</li>
                <li>Check if MongoDB is connected</li>
                <li>Verify the backend URL in your environment variables</li>
              </ul>
            </div>
          )}
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => refetch({ hard: true })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
              </svg>
              Retry
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => router.push('/admin/dashboard/users')}
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">User Not Found</h4>
          <p>The requested user could not be found.</p>
          <button
            className="btn btn-outline-secondary"
            onClick={() => router.push('/admin/dashboard/users')}
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 px-md-3 px-lg-4" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3 mb-md-4 gap-3">
        <div className="d-flex align-items-center flex-wrap gap-2">
          <button
            className="btn btn-outline-secondary d-flex align-items-center flex-shrink-0"
            onClick={() => router.push('/admin/dashboard/users')}
            style={{
              transition: 'all 0.3s ease',
              fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
              padding: '0.5rem 1rem'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateX(-3px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2 d-md-none">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="me-2 d-none d-md-block">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
            </svg>
            <span className="d-none d-sm-inline">Back</span>
          </button>
          <div className="d-flex align-items-center">
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
              </svg>
            </div>
            <div>
              <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>User Profile</h2>
              <p className="text-muted mb-0 small d-none d-md-block">View and manage user information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Navigation Tabs */}
      <div className="mt-4 mb-4">
        <div
          className="card border-0"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 250, 0.95) 100%)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div className="card-body p-2 p-md-3">
            <nav>
              <div className="nav nav-tabs border-0 d-flex flex-wrap justify-content-center" id="profileTabs" role="tablist" style={{ gap: '0.25rem' }}>
                <button
                  className={`nav-link ${activeTab === 'overview' ? 'active' : ''} d-flex align-items-center border-0 rounded-pill px-3 px-md-4 py-2 py-md-3`}
                  id="overview-tab"
                  type="button"
                  role="tab"
                  onClick={() => setActiveTab('overview')}
                  style={{
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    background: activeTab === 'overview' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'transparent',
                    color: activeTab === 'overview' ? 'white' : 'var(--text-muted)',
                    boxShadow: activeTab === 'overview' ? '0 4px 15px rgba(255, 140, 0, 0.4)' : 'none',
                    minWidth: '100px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'overview') {
                      e.target.style.background = 'rgba(0,0,0,0.05)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'overview') {
                      e.target.style.background = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                  </svg>
                  <span className="d-none d-sm-inline">Overview</span>
                </button>
                <button
                  className={`nav-link ${activeTab === 'reference' ? 'active' : ''} d-flex align-items-center border-0 rounded-pill px-3 px-md-4 py-2 py-md-3`}
                  id="reference-tab"
                  type="button"
                  role="tab"
                  onClick={() => setActiveTab('reference')}
                  style={{
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    background: activeTab === 'reference' ? 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' : 'transparent',
                    color: activeTab === 'reference' ? 'white' : 'var(--text-muted)',
                    boxShadow: activeTab === 'reference' ? '0 4px 15px rgba(168, 85, 247, 0.4)' : 'none',
                    minWidth: '100px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'reference') {
                      e.target.style.background = 'rgba(0,0,0,0.05)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'reference') {
                      e.target.style.background = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                    <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 0 0-.443.05 9.365 9.365 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 0 0 1.036-.696l.72-.504a.5.5 0 0 1 .671.33c.025.16.045.33.061.52.071.32.106.739.106 1.276 0 .256-.03.585-.113.856-.113.27-.234.566-.368.822a.5.5 0 0 1-.562.395c-.224-.053-.451-.224-.648-.433-.294-.403-.577-.843-.646-1.33a.5.5 0 0 1 .33-.671l.595-.195c.113-.037.23-.095.337-.174a1.9 1.9 0 0 0 .593-.286c.26-.186.458-.393.596-.653a.5.5 0 0 1 .874.33c-.16.387-.316.7-.52.932-.218.247-.444.378-.728.491-.303.123-.614.22-1.012.22z"/>
                  </svg>
                  <span className="d-none d-sm-inline">Reference</span>
                </button>
                <button
                  className={`nav-link ${activeTab === 'wallet' ? 'active' : ''} d-flex align-items-center border-0 rounded-pill px-3 px-md-4 py-2 py-md-3`}
                  id="wallet-tab"
                  type="button"
                  role="tab"
                  onClick={() => setActiveTab('wallet')}
                  style={{
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    background: activeTab === 'wallet' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
                    color: activeTab === 'wallet' ? 'white' : 'var(--text-muted)',
                    boxShadow: activeTab === 'wallet' ? '0 4px 15px rgba(34, 197, 94, 0.4)' : 'none',
                    minWidth: '100px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'wallet') {
                      e.target.style.background = 'rgba(0,0,0,0.05)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'wallet') {
                      e.target.style.background = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                    <path d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                  </svg>
                  <span className="d-none d-sm-inline">Wallet</span>
                </button>
                <button
                  className={`nav-link ${activeTab === 'notification' ? 'active' : ''} d-flex align-items-center border-0 rounded-pill px-3 px-md-4 py-2 py-md-3`}
                  id="notification-tab"
                  type="button"
                  role="tab"
                  onClick={() => setActiveTab('notification')}
                  style={{
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    background: activeTab === 'notification' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                    color: activeTab === 'notification' ? 'white' : 'var(--text-muted)',
                    boxShadow: activeTab === 'notification' ? '0 4px 15px rgba(245, 158, 11, 0.4)' : 'none',
                    minWidth: '100px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'notification') {
                      e.target.style.background = 'rgba(0,0,0,0.05)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'notification') {
                      e.target.style.background = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                  </svg>
                  <span className="d-none d-sm-inline">Notification</span>
                </button>
                <button
                  className={`nav-link ${activeTab === 'trade-history' ? 'active' : ''} d-flex align-items-center border-0 rounded-pill px-3 px-md-4 py-2 py-md-3`}
                  id="trade-history-tab"
                  type="button"
                  role="tab"
                  onClick={() => setActiveTab('trade-history')}
                  style={{
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    background: activeTab === 'trade-history' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'transparent',
                    color: activeTab === 'trade-history' ? 'white' : 'var(--text-muted)',
                    boxShadow: activeTab === 'trade-history' ? '0 4px 15px rgba(34, 197, 94, 0.4)' : 'none',
                    minWidth: '100px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'trade-history') {
                      e.target.style.background = 'rgba(0,0,0,0.05)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'trade-history') {
                      e.target.style.background = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                    <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM1 3.857A.857.857 0 0 1 1.857 3H8v.5a.5.5 0 0 0 1 0V3h5.143c.473 0 .857.384.857.857v10.286a.857.857 0 0 1-.857.857H8v-.5a.5.5 0 0 0-1 0v.5H1.857A.857.857 0 0 1 1 14.143V3.857z"/>
                    <path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                  </svg>
                  <span className="d-none d-sm-inline">Trade History</span>
                </button>
                <button
                  className={`nav-link ${activeTab === 'bots' ? 'active' : ''} d-flex align-items-center border-0 rounded-pill px-3 px-md-4 py-2 py-md-3`}
                  id="bots-tab"
                  type="button"
                  role="tab"
                  onClick={() => setActiveTab('bots')}
                  style={{
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    background: activeTab === 'bots' ? 'linear-gradient(135deg, #8b4513 0%, #654321 100%)' : 'transparent',
                    color: activeTab === 'bots' ? 'white' : 'var(--text-muted)',
                    boxShadow: activeTab === 'bots' ? '0 4px 15px rgba(139, 69, 19, 0.4)' : 'none',
                    minWidth: '100px',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'bots') {
                      e.target.style.background = 'rgba(0,0,0,0.05)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'bots') {
                      e.target.style.background = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                    <path d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8H8.5v.5a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6 5.5v-1zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1zM9 7.5v1.5H5V12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7.5H9z"/>
                    <path d="M.25 1a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 1 3H.25a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-3.5A.25.25 0 0 0 .75 1h-.5zM3 3a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H3z"/>
                  </svg>
                  <span className="d-none d-sm-inline">Bots</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
      <div className="row g-3 g-md-4">
        <div className="col-12 col-lg-4">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
                  border: '1px solid rgba(255, 140, 0, 0.2)',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
            }}
          >
            <div
              className="text-white p-3 p-md-4 p-lg-5"
              style={{
                    background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px 16px 0 0'
              }}
            >
              <div className="text-center position-relative">
                <div
                  style={{
                    width: 'clamp(80px, 20vw, 120px)',
                    height: 'clamp(80px, 20vw, 120px)',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 15px',
                    border: 'clamp(3px, 1vw, 5px) solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="clamp(40px, 10vw, 60px)" height="clamp(40px, 10vw, 60px)" fill="white" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                  </svg>
                </div>
                <h3 className="fw-bold mb-2" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)' }}>{user.name}</h3>
                <p className="mb-0 opacity-90 text-truncate" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>{user.email}</p>
                <div className="mt-3">
                  <span
                        className="badge bg-success"
                    style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', padding: '0.4rem 0.8rem' }}
                  >
                    {user.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="card-body p-3 p-md-4">
              <div className="mb-3 mb-md-4 pb-3 border-bottom">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="text-muted small">User ID</span>
                      <span className="fw-bold" style={{ color: '#ff8c00', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>#{user.userId}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="text-muted small">Account Type</span>
                  <span className="fw-semibold" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{user.accountType}</span>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 flex-shrink-0"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: user.verified ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 193, 7, 0.1)'
                      }}
                    >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill={user.verified ? '#28a745' : '#ffc107'} viewBox="0 0 16 16">
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                      </svg>
                    </div>
                    <span className="small" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>Email Verified</span>
                  </div>
                  <span className={`badge ${user.verified ? 'bg-success' : 'bg-warning'}`} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>
                    {user.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 flex-shrink-0"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: user.twoFactorEnabled ? 'rgba(40, 167, 69, 0.1)' : 'rgba(108, 117, 125, 0.1)'
                      }}
                    >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill={user.twoFactorEnabled ? '#28a745' : '#6c757d'} viewBox="0 0 16 16">
                        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                      </svg>
                    </div>
                    <span className="small" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>2FA Enabled</span>
                  </div>
                  <span className={`badge ${user.twoFactorEnabled ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>
                    {user.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="row g-3 g-md-4">
            <div className="col-12">
              <div
                className="card h-100"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(0, 102, 204, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0, 102, 204, 0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 102, 204, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 102, 204, 0.1)';
                }}
              >
                <div className="card-header border-bottom px-3 px-md-4 py-2 py-md-3" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(0, 102, 204, 0.1)'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#0066cc" viewBox="0 0 16 16">
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
                      </svg>
                    </div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Account Information</h5>
                  </div>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3 g-md-4">
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start p-3 rounded" style={{ background: 'rgba(0, 102, 204, 0.05)', border: '1px solid rgba(0, 102, 204, 0.1)', borderRadius: '12px' }}>
                        <div
                          className="d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                            <path d="M8 0a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 0-.708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0z"/>
                            <path d="M8 16a.5.5 0 0 1-.5-.5V12.207l-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-.5.5z"/>
                          </svg>
                        </div>
                        <div className="flex-grow-1">
                          <label className="text-muted small mb-1 d-block fw-semibold">API Keys</label>
                          <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', color: '#0066cc' }}>{activeApiKeys} Active</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start p-3 rounded" style={{ background: 'rgba(0, 102, 204, 0.05)', border: '1px solid rgba(0, 102, 204, 0.1)', borderRadius: '12px' }}>
                        <div
                          className="d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                          </svg>
                        </div>
                        <div className="flex-grow-1">
                          <label className="text-muted small mb-1 d-block fw-semibold">Member Since</label>
                          <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.3rem)', color: '#0066cc' }}>{user.joinDate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

                <div className="col-12">
                  <div
                    className="card"
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(67, 233, 123, 0.2)',
                      borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(67, 233, 123, 0.1)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (window.innerWidth > 768) {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(67, 233, 123, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(67, 233, 123, 0.1)';
                    }}
                  >
                    <div className="card-header border-bottom px-3 px-md-4 py-2 py-md-3" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                      <div className="d-flex align-items-center">
                        <div
                          className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'rgba(67, 233, 123, 0.1)'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#43e97b" viewBox="0 0 16 16">
                            <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                            <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                          </svg>
                        </div>
                        <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Connected Integrations</h5>
                        </div>
                      </div>
                    <div className="card-body p-3 p-md-4">
                      <div className="text-center py-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="var(--light-gray)" viewBox="0 0 16 16" className="mb-3">
                          <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                          <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                        </svg>
                        <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                          {Array.isArray(user.integrations) && user.integrations.length > 0 ? 'Integrations connected' : 'No integrations connected'}
                        </p>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reference' && (
                  <div className="row g-3 g-md-4">
            <div className="col-12">
              <div
                className="card"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(168, 85, 247, 0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(168, 85, 247, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.1)';
                }}
              >
                <div className="card-header border-bottom px-3 px-md-4 py-2 py-md-3" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                  <div className="d-flex align-items-center">
                        <div
                          className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                          style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                        boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                        <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 0 0-.443.05 9.365 9.365 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 0 0 1.036-.696l.72-.504a.5.5 0 0 1 .671.33c.025.16.045.33.061.52.071.32.106.739.106 1.276 0 .256-.03.585-.113.856-.113.27-.234.566-.368.822a.5.5 0 0 1-.562.395c-.224-.053-.451-.224-.648-.433-.294-.403-.577-.843-.646-1.33a.5.5 0 0 1 .33-.671l.595-.195c.113-.037.23-.095.337-.174a1.9 1.9 0 0 0 .593-.286c.26-.186.458-.393.596-.653a.5.5 0 0 1 .874.33c-.16.387-.316.7-.52.932-.218.247-.444.378-.728.491-.303.123-.614.22-1.012.22z"/>
                          </svg>
                        </div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Referral Program</h5>
                        </div>
                      </div>
                <div className="card-body p-3 p-md-4">
                  <div className="text-center py-5">
                    <div
                      className="d-flex align-items-center justify-content-center mx-auto mb-3"
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#a855f7" viewBox="0 0 16 16">
                        <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 0 0-.443.05 9.365 9.365 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 0 0 1.036-.696l.72-.504a.5.5 0 0 1 .671.33c.025.16.045.33.061.52.071.32.106.739.106 1.276 0 .256-.03.585-.113.856-.113.27-.234.566-.368.822a.5.5 0 0 1-.562.395c-.224-.053-.451-.224-.648-.433-.294-.403-.577-.843-.646-1.33a.5.5 0 0 1 .33-.671l.595-.195c.113-.037.23-.095.337-.174a1.9 1.9 0 0 0 .593-.286c.26-.186.458-.393.596-.653a.5.5 0 0 1 .874.33c-.16.387-.316.7-.52.932-.218.247-.444.378-.728.491-.303.123-.614.22-1.012.22z"/>
                      </svg>
                    </div>
                    <h4 className="text-muted mb-2">Referral Network</h4>
                    <p className="text-muted mb-4">View and manage user's referral connections and rewards</p>
                  </div>

                  {/* Referral Statistics */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                      <div className="p-3 rounded" style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">Total Referrals</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#a855f7" viewBox="0 0 16 16">
                            <path d="M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2.144 2.144 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a9.84 9.84 0 0 0-.443.05 9.365 9.365 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111L8.864.046zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a8.908 8.908 0 0 0 1.036-.696l.72-.504a.5.5 0 0 1 .671.33c.025.16.045.33.061.52.071.32.106.739.106 1.276 0 .256-.03.585-.113.856-.113.27-.234.566-.368.822a.5.5 0 0 1-.562.395c-.224-.053-.451-.224-.648-.433-.294-.403-.577-.843-.646-1.33a.5.5 0 0 1 .33-.671l.595-.195c.113-.037.23-.095.337-.174a1.9 1.9 0 0 0 .593-.286c.26-.186.458-.393.596-.653a.5.5 0 0 1 .874.33c-.16.387-.316.7-.52.932-.218.247-.444.378-.728.491-.303.123-.614.22-1.012.22z"/>
                          </svg>
                        </div>
                        <h4 className="mb-0 fw-bold text-purple">{Array.isArray(referrals?.referrals) ? referrals.referrals.length : 0}</h4>
                        <small className="text-muted">Direct referrals</small>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 rounded" style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">Active Referrals</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#22c55e" viewBox="0 0 16 16">
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                          </svg>
                        </div>
                        <h4 className="mb-0 fw-bold text-success">—</h4>
                        <small className="text-muted">No active-state data</small>
                      </div>
                    </div>
                    <div className="col-12 col-md-4">
                      <div className="p-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">Referral Earnings</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f59e0b" viewBox="0 0 16 16">
                            <path d="M8 0a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 0-.708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0z"/>
                          </svg>
                        </div>
                        <h4 className="mb-0 fw-bold" style={{ color: '#f59e0b' }}>—</h4>
                        <small className="text-muted">Earnings not tracked</small>
                </div>
              </div>
            </div>

                  {/* Referral Code */}
                  <div className="mb-4">
                    <div className="p-3 rounded" style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.1)', borderRadius: '12px' }}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fw-semibold">Referral Code</span>
                        <button
                          className="btn btn-sm btn-outline-purple"
                          style={{ borderRadius: '6px', fontSize: '0.75rem' }}
                        >
                          Copy Link
                        </button>
                      </div>
                      <div className="d-flex align-items-center">
                        <code className="flex-grow-1 me-2 p-2 bg-light rounded font-monospace" style={{ fontSize: '0.9rem' }}>
                          {referrals?.referralCode || user.referralCode || '—'}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Recent Referrals */}
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr style={{ background: 'rgba(168, 85, 247, 0.05)' }}>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Referred User</th>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Join Date</th>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Status</th>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Commission</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(Array.isArray(referrals?.referrals) ? referrals.referrals : []).length === 0 ? (
                          <tr>
                            <td className="px-3 py-4 text-center text-muted" colSpan={4}>
                              No referrals found
                            </td>
                          </tr>
                        ) : (
                        (referrals.referrals || []).map((referral, index) => (
                          <tr
                            key={index}
                            style={{
                              transition: 'all 0.3s ease',
                              borderBottom: '1px solid rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={(e) => {
                              if (window.innerWidth > 768) {
                                e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.03)';
                                e.currentTarget.style.transform = 'scale(1.001)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <td className="px-3 py-3">
                              <div>
                                <div className="fw-bold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>{referral.userId || '—'}</div>
                                <small className="text-muted">Referred user</small>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              <span className="fw-semibold" style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                                {referral.referredAt ? new Date(referral.referredAt).toISOString().split('T')[0] : '—'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="badge bg-secondary" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>
                                Recorded
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="fw-bold text-muted" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                                —
                              </span>
                            </td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="row g-3 g-md-4">
            <div className="col-12">
              {/* Wallet Balance Card */}
              <div
                className="card mb-4"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(34, 197, 94, 0.1)',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.1)';
                }}
              >
                <div className="card-header border-bottom px-3 px-md-4 py-2 py-md-3" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                        <path d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm7 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                      </svg>
                    </div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Wallet Balance :

                    {typeof usdtBalance === 'number' ? `USDT ${usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$ USDT 0.00'}

                    </h5>
                  </div>
                </div>
                
              </div>

              {/* Transaction History Card */}
              <div
                className="card"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.1)';
                }}
              >
                <div className="card-header border-bottom px-3 px-md-4 py-2 py-md-3" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                      </svg>
                    </div>
                      <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Transaction History</h5>
                    </div>
                    <select
                      className="form-select form-select-sm"
                      value={transactionFilter}
                      onChange={(e) => setTransactionFilter(e.target.value)}
                      style={{
                        borderRadius: '8px',
                        fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                        minWidth: '140px',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      <option value="all">All Transactions</option>
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="transfer">Transfer</option>
                      <option value="trade">Trade</option>
                      <option value="fee">Fee</option>
                      <option value="reward">Reward</option>
                    </select>
                  </div>
                </div>
                <div className="card-body p-3 p-md-4">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-5">
                      <div
                        className="d-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#3b82f6" viewBox="0 0 16 16">
                          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                        </svg>
                      </div>
                      <h4 className="text-muted mb-2">No Transactions Found</h4>
                      <p className="text-muted mb-0">
                        {transactionFilter === 'all' 
                          ? 'No transaction history available' 
                          : `No ${transactionFilter} transactions found`}
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead>
                          <tr style={{ background: 'rgba(59, 130, 246, 0.05)' }}>
                            <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Date</th>
                            <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Type</th>
                            <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Currency</th>
                            <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Amount</th>
                            <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Status</th>
                            <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTransactions.map((transaction, index) => (
                            <tr
                              key={index}
                              style={{
                                transition: 'all 0.3s ease',
                                borderBottom: '1px solid rgba(0,0,0,0.05)'
                              }}
                              onMouseEnter={(e) => {
                                if (window.innerWidth > 768) {
                                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.03)';
                                  e.currentTarget.style.transform = 'scale(1.001)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            >
                              <td className="px-3 py-3">
                                <span className="fw-semibold" style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                                  {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : '—'}
                    </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`badge ${
                                  transaction.type === 'deposit' ? 'bg-success' :
                                  transaction.type === 'withdrawal' ? 'bg-danger' :
                                  transaction.type === 'transfer' ? 'bg-primary' :
                                  transaction.type === 'trade' ? 'bg-warning' :
                                  transaction.type === 'fee' ? 'bg-secondary' :
                                  transaction.type === 'reward' ? 'bg-info' : 'bg-secondary'
                                }`} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>
                                  {String(transaction.type || '—').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className="fw-bold" style={{ color: '#3b82f6', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                                  {transaction.currency || '—'}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className="fw-bold" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                                  {typeof transaction.amount === 'number' 
                                    ? `${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })} ${transaction.currency || ''}` 
                                    : '—'}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`badge ${
                                  transaction.status === 'completed' ? 'bg-success' : 
                                  transaction.status === 'pending' ? 'bg-warning' : 
                                  transaction.status === 'failed' ? 'bg-danger' : 
                                  'bg-secondary'
                                }`} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>
                                  {String(transaction.status || '—').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className="text-truncate d-block" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', maxWidth: '160px' }} title={transaction.description || ''}>
                                  {transaction.description || '—'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                  </div>
                  )}
                  </div>
                  </div>
                  </div>
                </div>
        )}

        {activeTab === 'notification' && (
          <div className="row g-3 g-md-4">
            <div className="col-12">
              {/* Notification Sub-tabs */}
              <div className="mb-4">
                <div className="card border-0" style={{ background: 'transparent' }}>
                  <div className="card-body p-0">
                    <nav>
                      <div className="nav nav-pills d-flex flex-wrap justify-content-center gap-2" id="notificationTabs" role="tablist">
                        <button
                          className={`nav-link ${notificationSubTab === 'list' ? 'active' : ''} border-0 rounded-pill px-3 px-md-4 py-2 py-md-3`}
                          type="button"
                          onClick={() => setNotificationSubTab('list')}
                          style={{
                            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            background: notificationSubTab === 'list' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255,255,255,0.8)',
                            color: notificationSubTab === 'list' ? 'white' : 'var(--text-muted)',
                            boxShadow: notificationSubTab === 'list' ? '0 4px 15px rgba(245, 158, 11, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
                            minWidth: '120px',
                            justifyContent: 'center'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                            <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                          </svg>
                          Notifications
                        </button>
                        <button
                          className={`nav-link ${notificationSubTab === 'create' ? 'active' : ''} border-0 rounded-pill px-3 px-md-4 py-2 py-md-3`}
                          type="button"
                          onClick={() => setNotificationSubTab('create')}
                          style={{
                            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            background: notificationSubTab === 'create' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' : 'rgba(255,255,255,0.8)',
                            color: notificationSubTab === 'create' ? 'white' : 'var(--text-muted)',
                            boxShadow: notificationSubTab === 'create' ? '0 4px 15px rgba(34, 197, 94, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)',
                            minWidth: '120px',
                            justifyContent: 'center'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                            <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
                          </svg>
                          Create
                        </button>
                      </div>
                    </nav>
                  </div>
              </div>
            </div>

              {/* Notification List Tab */}
              {notificationSubTab === 'list' && (
                <div className="row g-3 g-md-4">
                  <div className="col-12">
              <div
                      className="card"
                style={{
                  background: '#ffffff',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(245, 158, 11, 0.1)';
                }}
              >
                <div className="card-header border-bottom px-3 px-md-4 py-2 py-md-3" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                        <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                      }}
                    >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                      </svg>
                    </div>
                            <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Personal Notifications</h5>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-warning text-dark">{unreadCount} Unread</span>
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              style={{
                                borderRadius: '8px',
                                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)'
                              }}
                              onClick={() => refetch({ hard: true })}
                            >
                              Refresh
                            </button>
                          </div>
                  </div>
                </div>
                <div className="card-body p-3 p-md-4">
                        <div className="text-center py-4">
                          <div
                            className="d-flex align-items-center justify-content-center mx-auto mb-3"
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#f59e0b" viewBox="0 0 16 16">
                              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                            </svg>
                  </div>
                          <h4 className="text-muted mb-2">Personal Notifications</h4>
                          <p className="text-muted mb-4">Notifications specifically sent to this user</p>
                    </div>

                        {/* Notifications List */}
                        <div className="space-y-3">
                          {(Array.isArray(notifications) ? notifications : []).length === 0 ? (
                            <div className="text-center text-muted py-4">
                              No notifications found
                      </div>
                          ) : (notifications || []).map((notification) => (
                        <div
                              key={notification._id || notification.id || `${notification.title}-${notification.createdAt}`}
                              className={`d-flex align-items-start p-3 rounded ${!notification.read ? 'border-start border-warning border-4' : ''}`}
                          style={{
                                background: !notification.read ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.5)',
                                border: !notification.read ? '1px solid rgba(245, 158, 11, 0.1)' : '1px solid rgba(0,0,0,0.05)',
                                borderRadius: '12px',
                                transition: 'all 0.3s ease',
                                position: 'relative'
                              }}
                              onMouseEnter={(e) => {
                                if (window.innerWidth > 768) {
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.1)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div
                                className="d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                          style={{
                            width: '40px',
                            height: '40px',
                                  borderRadius: '50%',
                                  background: notification.type === 'warning' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                             notification.type === 'success' ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' :
                                             'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                                  {notification.icon === 'shield' && <path d="M5.338 1.59a61.44 61.44 0 0 0 4.654.29c.21-.007.374-.26.344-.44-.054-.427-.836-.986-2.431-1.05C6.5.228 5.617.466 5.338 1.59zM7 4.674c1.787.553 5.363 1.725 5.363 4.042 0 1.847-1.39 3.366-3.25 3.95a.5.5 0 0 1-.248 0C6.39 12.082 5 10.563 5 8.716c0-2.317 3.573-3.49 5.363-4.042z"/>}
                                  {notification.icon === 'check-circle' && (
                                    <>
                                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                      <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                    </>
                                  )}
                                  {notification.icon === 'star' && <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>}
                                  {notification.icon === 'gift' && <path d="M3 2.5a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 5 0v.006c0 .07 0 .27-.038.494H15a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 14.5V6a1 1 0 0 1 1-1V4a1 1 0 0 1 1-1v-.506A2.5 2.5 0 0 1 3 2.5zM2.5 4v1h1V4H2.5zm3 0v1h1V4H5.5zm3 0v1h1V4H8.5z"/>}
                                  {notification.icon === 'lock' && <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>}
                          </svg>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                                <div className="d-flex align-items-start justify-content-between mb-1">
                                  <h6 className="mb-0 fw-bold">{notification.title}</h6>
                                  <small className="text-muted ms-2 flex-shrink-0">
                                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : '—'}
                                  </small>
                        </div>
                                <p className="mb-2 text-muted small">{notification.message}</p>
                                {!notification.read && (
                                  <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>Unread</span>
                                )}
                      </div>
                              <div className="d-flex align-items-center ms-2 gap-1">
                                <button
                                  className="btn btn-sm btn-outline-secondary border-0"
                                  title="Mark as read"
                                  onClick={() => onMarkNotificationRead(notification._id)}
                                  disabled={!notification?._id || notification.read}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                  </svg>
                                </button>
                    </div>
                  </div>
                          ))}
                </div>

                        <div className="text-center mt-4">
                          <button
                            className="btn btn-outline-warning d-flex align-items-center mx-auto"
                            style={{
                              borderRadius: '10px',
                              padding: '0.75rem 1.5rem',
                              fontWeight: '600',
                              transition: 'all 0.3s ease'
                            }}
                            onClick={() => refetch({ hard: true })}
                          >
                            Refresh
                          </button>
              </div>
            </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Create Notification Tab */}
              {notificationSubTab === 'create' && (
                <div className="row g-3 g-md-4">
                  <div className="col-12">
              <div
                      className="card"
                style={{
                  background: '#ffffff',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(34, 197, 94, 0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.1)';
                }}
              >
                <div className="card-header border-bottom px-3 px-md-4 py-2 py-md-3" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                      }}
                    >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                              <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
                      </svg>
                    </div>
                          <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Create Personal Notification</h5>
                  </div>
                </div>
                <div className="card-body p-3 p-md-4">
                        <form onSubmit={onCreateNotification}>
                          {notifError && (
                            <div className="alert alert-danger" role="alert" style={{ borderRadius: '12px' }}>
                              {notifError}
                            </div>
                          )}
                          <div className="mb-4">
                            <label className="form-label fw-semibold">Notification Title</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Enter notification title"
                              value={notifForm.title}
                              onChange={(e) => setNotifForm((p) => ({ ...p, title: e.target.value }))}
                              required
                              style={{
                                borderRadius: '8px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                padding: '0.75rem 1rem',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                          }}
                        />
                      </div>

                          <div className="mb-4">
                            <label className="form-label fw-semibold">Notification Message</label>
                            <textarea
                              className="form-control"
                              rows="4"
                              placeholder="Enter detailed notification message"
                              value={notifForm.message}
                              onChange={(e) => setNotifForm((p) => ({ ...p, message: e.target.value }))}
                              required
                              style={{
                                borderRadius: '8px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                padding: '0.75rem 1rem',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                resize: 'vertical'
                              }}
                            />
                    </div>

                          <div className="mb-4">
                            <label className="form-label fw-semibold">Notification Type</label>
                            <select
                              className="form-select"
                              value={notifForm.type}
                              onChange={(e) => setNotifForm((p) => ({ ...p, type: e.target.value }))}
                              style={{
                                borderRadius: '8px',
                                border: '1px solid rgba(0,0,0,0.1)',
                                padding: '0.75rem 1rem',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                              }}
                            >
                              <option value="info">Information</option>
                              <option value="success">Success</option>
                              <option value="warning">Warning</option>
                              <option value="error">Error</option>
                            </select>
                  </div>

                          <div className="mb-4">
                            <label className="form-label fw-semibold">Priority Level</label>
                            <div className="d-flex gap-3">
                              {[
                                { value: 'low', label: 'Low', color: '#6c757d' },
                                { value: 'medium', label: 'Medium', color: '#ffc107' },
                                { value: 'high', label: 'High', color: '#fd7e14' },
                                { value: 'urgent', label: 'Urgent', color: '#dc3545' }
                              ].map((priority) => (
                                <div key={priority.value} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="priority"
                                    value={priority.value}
                                    id={priority.value}
                                    style={{ accentColor: priority.color }}
                                  />
                                  <label className="form-check-label fw-semibold" htmlFor={priority.value} style={{ color: priority.color }}>
                                    {priority.label}
                                  </label>
                  </div>
                              ))}
                  </div>
                </div>

                          <div className="mb-4">
                            <div className="form-check">
                              <input className="form-check-input" type="checkbox" id="sendEmail" />
                              <label className="form-check-label fw-semibold" htmlFor="sendEmail">
                                Also send as email notification
                              </label>
              </div>
            </div>

                          <div className="text-center">
                            <button
                              type="submit"
                              className="btn btn-success d-flex align-items-center mx-auto"
                              disabled={notifSubmitting}
                              style={{
                                borderRadius: '10px',
                                padding: '0.75rem 2rem',
                                fontWeight: '600',
                                fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                                boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                                <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
                              </svg>
                              {notifSubmitting ? 'Sending...' : 'Send Notification'}
                            </button>
            </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'trade-history' && (
          <div className="row g-3 g-md-4">
            <div className="col-12">
              <div
                className="card"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(34, 197, 94, 0.1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (window.innerWidth > 768) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(34, 197, 94, 0.1)';
                }}
              >
                <div className="card-header border-bottom px-3 px-md-4 py-2 py-md-3" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                  <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)'
                      }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                          <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM1 3.857A.857.857 0 0 1 1.857 3H8v.5a.5.5 0 0 0 1 0V3h5.143c.473 0 .857.384.857.857v10.286a.857.857 0 0 1-.857.857H8v-.5a.5.5 0 0 0-1 0v.5H1.857A.857.857 0 0 1 1 14.143V3.857z"/>
                          <path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                      </svg>
                    </div>
                      <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Trade History</h5>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <select
                        className="form-select form-select-sm"
                        style={{
                          borderRadius: '8px',
                          fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                          minWidth: '120px'
                        }}
                      >
                        <option value="all">All Trades</option>
                        <option value="buy">Buy Orders</option>
                        <option value="sell">Sell Orders</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                      </select>
                      <button
                        className="btn btn-sm d-flex align-items-center"
                        style={{
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.4rem 0.8rem',
                          fontWeight: '600',
                          fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                        </svg>
                        Export
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-body p-3 p-md-4">
                  {/* Trading Statistics */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-3">
                      <div className="p-3 rounded" style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">Total Trades</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#22c55e" viewBox="0 0 16 16">
                            <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM1 3.857A.857.857 0 0 1 1.857 3H8v.5a.5.5 0 0 0 1 0V3h5.143c.473 0 .857.384.857.857v10.286a.857.857 0 0 1-.857.857H8v-.5a.5.5 0 0 0-1 0v.5H1.857A.857.857 0 0 1 1 14.143V3.857z"/>
                            <path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                          </svg>
                  </div>
                        <h4 className="mb-0 fw-bold text-success">{tradeActivities.length}</h4>
                        <small className="text-muted">All time trades</small>
                    </div>
                      </div>
                    <div className="col-12 col-md-3">
                      <div className="p-3 rounded" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">Win Rate</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#3b82f6" viewBox="0 0 16 16">
                            <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm9.5 5.5a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0V6a.5.5 0 0 0-.5-.5z"/>
                            <path d="M10.5 5.5a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0V6a.5.5 0 0 0-.5-.5z"/>
                          </svg>
                        </div>
                        <h4 className="mb-0 fw-bold text-primary">—</h4>
                        <small className="text-muted">No P&L tracking</small>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div className="p-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">Volume</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f59e0b" viewBox="0 0 16 16">
                            <path d="M8 0a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 0-.708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0z"/>
                            <path d="M8 16a.5.5 0 0 1-.5-.5V12.207l-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-.5.5z"/>
                          </svg>
                        </div>
                        <h4 className="mb-0 fw-bold" style={{ color: '#f59e0b' }}>—</h4>
                        <small className="text-muted">Volume not tracked</small>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div className="p-3 rounded" style={{ background: 'rgba(139, 69, 19, 0.05)', border: '1px solid rgba(139, 69, 19, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">P&L</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#8b4513" viewBox="0 0 16 16">
                            <path d="M8 0a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 0-.708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0z"/>
                            <path d="M8 16a.5.5 0 0 1-.5-.5V12.207l-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-.5.5z"/>
                          </svg>
                        </div>
                        <h4 className="mb-0 fw-bold text-success">—</h4>
                        <small className="text-muted">P&L not tracked</small>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-5">
                    <div
                      className="d-flex align-items-center justify-content-center mx-auto mb-3"
                          style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#22c55e" viewBox="0 0 16 16">
                        <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM1 3.857A.857.857 0 0 1 1.857 3H8v.5a.5.5 0 0 0 1 0V3h5.143c.473 0 .857.384.857.857v10.286a.857.857 0 0 1-.857.857H8v-.5a.5.5 0 0 0-1 0v.5H1.857A.857.857 0 0 1 1 14.143V3.857z"/>
                        <path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                      </svg>
                      </div>
                    <h4 className="text-muted mb-2">Trading Activity</h4>
                    <p className="text-muted mb-4">View and analyze user's trading history and performance</p>
                    </div>

                  {/* Trade History Table */}
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr style={{ background: 'rgba(34, 197, 94, 0.05)' }}>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Date</th>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Pair</th>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Type</th>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Amount</th>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Price</th>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Status</th>
                          <th className="px-3 py-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tradeActivities.length === 0 ? (
                          <tr>
                            <td className="px-3 py-4 text-center text-muted" colSpan={7}>
                              No trade activity found
                            </td>
                          </tr>
                        ) : tradeActivities.map((trade, index) => (
                          <tr
                          key={index}
                          style={{
                              transition: 'all 0.3s ease',
                              borderBottom: '1px solid rgba(0,0,0,0.05)'
                            }}
                            onMouseEnter={(e) => {
                              if (window.innerWidth > 768) {
                                e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.03)';
                                e.currentTarget.style.transform = 'scale(1.001)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <td className="px-3 py-3">
                              <span className="fw-semibold" style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                                {trade.timestamp ? new Date(trade.timestamp).toLocaleString() : '—'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="fw-bold" style={{ color: '#22c55e', fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                                {trade.metadata?.pair || trade.metadata?.symbol || '—'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className={`badge ${
                                String(trade.metadata?.side || '').toLowerCase() === 'buy' ? 'bg-success' :
                                String(trade.metadata?.side || '').toLowerCase() === 'sell' ? 'bg-danger' : 'bg-warning'
                              }`} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>
                                {trade.metadata?.side ? String(trade.metadata.side).toUpperCase() : 'TRADE'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="fw-semibold" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                                {trade.metadata?.amount ?? trade.metadata?.qty ?? '—'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="fw-semibold" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                                {trade.metadata?.price ?? '—'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="badge bg-secondary" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>
                                {trade.metadata?.status ? String(trade.metadata.status).toUpperCase() : 'RECORDED'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <span className="fw-bold text-muted" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                                —
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-center mt-4">
                    <button
                      className="btn btn-outline-success d-flex align-items-center mx-auto"
                      style={{
                        borderRadius: '10px',
                        padding: '0.75rem 1.5rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => refetch({ hard: true })}
                    >
                      Refresh
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            </div>
        )}

        {activeTab === 'bots' && (
          <div className="row g-3 g-md-4">
            <div className="col-12">
              <div
                className="card"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(139, 69, 19, 0.2)',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(139, 69, 19, 0.1)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (window.innerWidth > 768) {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(139, 69, 19, 0.15)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(139, 69, 19, 0.1)';
                }}
              >
                <div className="card-header border-bottom px-3 px-md-4 py-2 py-md-3" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
                  <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                          background: 'linear-gradient(135deg, #8b4513 0%, #654321 100%)',
                          boxShadow: '0 4px 15px rgba(139, 69, 19, 0.3)'
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                          <path d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8H8.5v.5a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6 5.5v-1zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1zM9 7.5v1.5H5V12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7.5H9z"/>
                          <path d="M.25 1a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 1 3H.25a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-3.5A.25.25 0 0 0 .75 1h-.5zM3 3a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H3z"/>
                      </svg>
                        </div>
                      <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Trading Bots</h5>
                    </div>
                    <button
                      className="btn btn-sm d-flex align-items-center"
                      style={{
                        background: 'linear-gradient(135deg, #8b4513 0%, #654321 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.4rem 0.8rem',
                        fontWeight: '600',
                        fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                        boxShadow: '0 2px 8px rgba(139, 69, 19, 0.4)'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                        <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2z"/>
                      </svg>
                      Create Bot
                    </button>
                    </div>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="text-center py-5">
                        <div
                      className="d-flex align-items-center justify-content-center mx-auto mb-3"
                          style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(101, 67, 33, 0.1) 100%)'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="#8b4513" viewBox="0 0 16 16">
                        <path d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8H8.5v.5a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6 5.5v-1zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1zM9 7.5v1.5H5V12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7.5H9z"/>
                        <path d="M.25 1a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 1 3H.25a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-3.5A.25.25 0 0 0 .75 1h-.5zM3 3a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H3z"/>
                      </svg>
              </div>
                    <h4 className="text-muted mb-2">Trading Bots</h4>
                    <p className="text-muted mb-4">Manage and monitor user's automated trading bots</p>
            </div>

                  {/* Bot Statistics */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-3">
                      <div className="p-3 rounded" style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">Active Bots</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#22c55e" viewBox="0 0 16 16">
                            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                          </svg>
          </div>
                        <h4 className="mb-0 fw-bold text-success">{(strategies || []).filter((s) => s?.status === 'active').length}</h4>
                        <small className="text-muted">Running bots</small>
        </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div className="p-3 rounded" style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">Total Bots</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#3b82f6" viewBox="0 0 16 16">
                            <path d="M6 3.5A1.5 1.5 0 0 1 7.5 2h1A1.5 1.5 0 0 1 10 3.5v1A1.5 1.5 0 0 1 8.5 6v1H14a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-1 0V8H8.5v.5a.5.5 0 0 1-1 0v-2A1.5 1.5 0 0 1 6 5.5v-1zM8.5 5a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1zM9 7.5v1.5H5V12a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V7.5H9z"/>
                            <path d="M.25 1a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h.5A.25.25 0 0 0 1 3H.25a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-3.5A.25.25 0 0 0 .75 1h-.5zM3 3a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 1 .5-.5h.5a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H3z"/>
                          </svg>
                        </div>
                        <h4 className="mb-0 fw-bold text-primary">{(strategies || []).length}</h4>
                        <small className="text-muted">Created bots</small>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div className="p-3 rounded" style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">Success Rate</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#f59e0b" viewBox="0 0 16 16">
                            <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm9.5 5.5a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0V6a.5.5 0 0 0-.5-.5z"/>
                            <path d="M10.5 5.5a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 1 0V6a.5.5 0 0 0-.5-.5z"/>
                          </svg>
                        </div>
                        <h4 className="mb-0 fw-bold" style={{ color: '#f59e0b' }}>—</h4>
                        <small className="text-muted">Win rate not tracked</small>
                      </div>
                    </div>
                    <div className="col-12 col-md-3">
                      <div className="p-3 rounded" style={{ background: 'rgba(139, 69, 19, 0.05)', border: '1px solid rgba(139, 69, 19, 0.1)', borderRadius: '12px' }}>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="text-muted small fw-semibold">Total P&L</span>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="#8b4513" viewBox="0 0 16 16">
                            <path d="M8 0a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 0-.708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0z"/>
                            <path d="M8 16a.5.5 0 0 1-.5-.5V12.207l-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-.5.5z"/>
                          </svg>
                        </div>
                        <h4 className="mb-0 fw-bold text-success">—</h4>
                        <small className="text-muted">P&L not tracked</small>
                      </div>
                    </div>
                  </div>

                  {/* Bots List */}
                  <div className="row g-3">
                    {(strategies || []).length === 0 ? (
                      <div className="col-12">
                        <div className="text-center text-muted py-4">No bots found</div>
                      </div>
                    ) : (strategies || []).map((bot, index) => (
                      <div key={index} className="col-12 col-md-6">
                        <div
                          className="p-3 rounded"
                          style={{
                            background: 'rgba(139, 69, 19, 0.05)',
                            border: '1px solid rgba(139, 69, 19, 0.1)',
                            borderRadius: '12px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (window.innerWidth > 768) {
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div className="d-flex align-items-start justify-content-between mb-3">
                            <div>
                              <h6 className="mb-1 fw-bold">{bot.name || bot.strategyId?.name || 'Strategy'}</h6>
                              <small className="text-muted">{bot.strategyId?.name || 'Trading strategy'}</small>
                        </div>
                            <span className={`badge ${
                              bot.status === 'active' ? 'bg-success' :
                              bot.status === 'paused' ? 'bg-warning' : 'bg-secondary'
                            }`}>
                              {String(bot.status || 'inactive').toUpperCase()}
                            </span>
                    </div>

                          <div className="row g-2 mb-3">
                            <div className="col-6">
                              <div className="text-center">
                                <small className="text-muted d-block">Created</small>
                                <span className="fw-bold">{bot.createdAt ? new Date(bot.createdAt).toISOString().split('T')[0] : '—'}</span>
                    </div>
                </div>
                            <div className="col-6">
                              <div className="text-center">
                                <small className="text-muted d-block">Status</small>
                                <span className="fw-bold" style={{ color: '#8b4513' }}>{String(bot.status || 'inactive').toUpperCase()}</span>
              </div>
            </div>
          </div>

                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <small className="text-muted">Updated via strategy status</small>
        </div>

                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              style={{ flex: 1, borderRadius: '6px', fontSize: '0.75rem' }}
                            >
                              Manage
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: '6px', fontSize: '0.75rem' }}>
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
