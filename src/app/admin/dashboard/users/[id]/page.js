'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function UserProfile() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const usersData = {
    1: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      plan: 'Premium',
      status: 'Active',
      joinDate: '2024-01-15',
      phone: '+1 (555) 123-4567',
      location: 'New York, USA',
      lastLogin: '2024-01-20 14:30',
      totalProjects: 24,
      storageUsed: '8.5 GB',
      storageLimit: '500 GB',
      billingCycle: 'Monthly',
      nextBilling: '2024-02-15',
      paymentMethod: 'Credit Card ending in 4567',
      accountType: 'Business',
      verified: true,
      twoFactorEnabled: true,
      apiKeys: 3,
      integrations: ['Slack', 'GitHub', 'Stripe']
    },
    2: {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      plan: 'Pro',
      status: 'Active',
      joinDate: '2024-01-14',
      phone: '+1 (555) 234-5678',
      location: 'Los Angeles, USA',
      lastLogin: '2024-01-20 10:15',
      totalProjects: 12,
      storageUsed: '3.2 GB',
      storageLimit: '50 GB',
      billingCycle: 'Monthly',
      nextBilling: '2024-02-14',
      paymentMethod: 'PayPal',
      accountType: 'Professional',
      verified: true,
      twoFactorEnabled: false,
      apiKeys: 1,
      integrations: ['GitHub']
    },
    3: {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      plan: 'Basic',
      status: 'Inactive',
      joinDate: '2024-01-13',
      phone: '+1 (555) 345-6789',
      location: 'Chicago, USA',
      lastLogin: '2024-01-10 09:00',
      totalProjects: 5,
      storageUsed: '1.8 GB',
      storageLimit: '5 GB',
      billingCycle: 'Monthly',
      nextBilling: '2024-02-13',
      paymentMethod: 'Credit Card ending in 7890',
      accountType: 'Personal',
      verified: false,
      twoFactorEnabled: false,
      apiKeys: 0,
      integrations: []
    },
    4: {
      id: 4,
      name: 'Alice Williams',
      email: 'alice@example.com',
      plan: 'Premium',
      status: 'Active',
      joinDate: '2024-01-12',
      phone: '+1 (555) 456-7890',
      location: 'San Francisco, USA',
      lastLogin: '2024-01-20 16:45',
      totalProjects: 18,
      storageUsed: '12.3 GB',
      storageLimit: '500 GB',
      billingCycle: 'Annual',
      nextBilling: '2025-01-12',
      paymentMethod: 'Credit Card ending in 2345',
      accountType: 'Enterprise',
      verified: true,
      twoFactorEnabled: true,
      apiKeys: 5,
      integrations: ['Slack', 'GitHub', 'Stripe', 'Jira', 'Discord']
    },
    5: {
      id: 5,
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      plan: 'Pro',
      status: 'Active',
      joinDate: '2024-01-11',
      phone: '+1 (555) 567-8901',
      location: 'Seattle, USA',
      lastLogin: '2024-01-19 11:20',
      totalProjects: 8,
      storageUsed: '2.1 GB',
      storageLimit: '50 GB',
      billingCycle: 'Monthly',
      nextBilling: '2024-02-11',
      paymentMethod: 'Bank Transfer',
      accountType: 'Professional',
      verified: true,
      twoFactorEnabled: true,
      apiKeys: 2,
      integrations: ['GitHub', 'Slack']
    },
    6: {
      id: 6,
      name: 'Diana Prince',
      email: 'diana@example.com',
      plan: 'Premium',
      status: 'Active',
      joinDate: '2024-01-10',
      phone: '+1 (555) 678-9012',
      location: 'Boston, USA',
      lastLogin: '2024-01-20 13:10',
      totalProjects: 30,
      storageUsed: '15.7 GB',
      storageLimit: '500 GB',
      billingCycle: 'Monthly',
      nextBilling: '2024-02-10',
      paymentMethod: 'Credit Card ending in 5678',
      accountType: 'Business',
      verified: true,
      twoFactorEnabled: true,
      apiKeys: 4,
      integrations: ['Slack', 'GitHub', 'Stripe', 'Trello']
    },
    7: {
      id: 7,
      name: 'Edward Norton',
      email: 'edward@example.com',
      plan: 'Basic',
      status: 'Inactive',
      joinDate: '2024-01-09',
      phone: '+1 (555) 789-0123',
      location: 'Miami, USA',
      lastLogin: '2024-01-08 15:30',
      totalProjects: 3,
      storageUsed: '0.9 GB',
      storageLimit: '5 GB',
      billingCycle: 'Monthly',
      nextBilling: '2024-02-09',
      paymentMethod: 'Credit Card ending in 0123',
      accountType: 'Personal',
      verified: false,
      twoFactorEnabled: false,
      apiKeys: 0,
      integrations: []
    },
    8: {
      id: 8,
      name: 'Fiona Apple',
      email: 'fiona@example.com',
      plan: 'Pro',
      status: 'Active',
      joinDate: '2024-01-08',
      phone: '+1 (555) 890-1234',
      location: 'Austin, USA',
      lastLogin: '2024-01-20 08:00',
      totalProjects: 15,
      storageUsed: '4.5 GB',
      storageLimit: '50 GB',
      billingCycle: 'Monthly',
      nextBilling: '2024-02-08',
      paymentMethod: 'PayPal',
      accountType: 'Professional',
      verified: true,
      twoFactorEnabled: false,
      apiKeys: 2,
      integrations: ['GitHub', 'Slack']
    },
    9: {
      id: 9,
      name: 'George Lucas',
      email: 'george@example.com',
      plan: 'Premium',
      status: 'Active',
      joinDate: '2024-01-07',
      phone: '+1 (555) 901-2345',
      location: 'Denver, USA',
      lastLogin: '2024-01-20 17:20',
      totalProjects: 22,
      storageUsed: '9.8 GB',
      storageLimit: '500 GB',
      billingCycle: 'Annual',
      nextBilling: '2025-01-07',
      paymentMethod: 'Credit Card ending in 3456',
      accountType: 'Enterprise',
      verified: true,
      twoFactorEnabled: true,
      apiKeys: 6,
      integrations: ['Slack', 'GitHub', 'Stripe', 'Jira', 'Discord', 'Trello']
    },
    10: {
      id: 10,
      name: 'Helen Mirren',
      email: 'helen@example.com',
      plan: 'Basic',
      status: 'Active',
      joinDate: '2024-01-06',
      phone: '+1 (555) 012-3456',
      location: 'Portland, USA',
      lastLogin: '2024-01-19 12:45',
      totalProjects: 6,
      storageUsed: '1.2 GB',
      storageLimit: '5 GB',
      billingCycle: 'Monthly',
      nextBilling: '2024-02-06',
      paymentMethod: 'Credit Card ending in 7890',
      accountType: 'Personal',
      verified: true,
      twoFactorEnabled: false,
      apiKeys: 0,
      integrations: []
    }
  };

  useEffect(() => {
    const userId = parseInt(params.id);
    const userData = usersData[userId];
    
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-5 px-2">
        <div className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="var(--danger)" viewBox="0 0 16 16" className="mb-3">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
          </svg>
        </div>
        <h3 className="text-muted mb-3" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)' }}>User Not Found</h3>
        <button className="btn btn-primary" onClick={() => router.push('/admin/dashboard/users')}>
          Back to User List
        </button>
      </div>
    );
  }

  const getPlanGradient = (plan) => {
    switch (plan) {
      case 'Premium':
        return 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)';
      case 'Pro':
        return 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)';
      default:
        return 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'Premium':
        return '#ff8c00';
      case 'Pro':
        return '#ff8c00';
      default:
        return '#0066cc';
    }
  };

  const storagePercentage = (parseFloat(user.storageUsed) / parseFloat(user.storageLimit.replace(' GB', ''))) * 100;

  return (
    <div className="px-2 px-md-3 px-lg-4">
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
                background: getPlanGradient(user.plan),
                boxShadow: `0 4px 15px ${getPlanColor(user.plan)}40`
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-md-none">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
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

      <div className="row g-3 g-md-4">
        <div className="col-12 col-lg-4">
          <div
            className="card border-0 h-100"
            style={{
              boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
              borderRadius: '16px',
              overflow: 'hidden'
            }}
          >
            <div
              className="text-white p-3 p-md-4 p-lg-5"
              style={{
                background: getPlanGradient(user.plan),
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                className="d-none d-md-block"
                style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)'
                }}
              />
              <div
                className="d-none d-md-block"
                style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '-30px',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.1)'
                }}
              />
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
                    className={`badge ${
                      user.status === 'Active' ? 'bg-success' : 'bg-secondary'
                    }`}
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
                  <span className="fw-bold" style={{ color: getPlanColor(user.plan), fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>#{user.id}</span>
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill={user.verified ? '#28a745' : '#ffc107'} viewBox="0 0 16 16" className="d-md-none">
                        {user.verified ? (
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                        ) : (
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        )}
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill={user.verified ? '#28a745' : '#ffc107'} viewBox="0 0 16 16" className="d-none d-md-block">
                        {user.verified ? (
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                        ) : (
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        )}
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill={user.twoFactorEnabled ? '#28a745' : '#6c757d'} viewBox="0 0 16 16" className="d-md-none">
                        <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill={user.twoFactorEnabled ? '#28a745' : '#6c757d'} viewBox="0 0 16 16" className="d-none d-md-block">
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
                className="card border-0 h-100"
                style={{
                  boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
                  borderRadius: '16px'
                }}
              >
                <div className="card-header bg-white border-bottom px-3 px-md-4 py-2 py-md-3" style={{ borderRadius: '16px 16px 0 0' }}>
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                        boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16" className="d-md-none">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                        <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                      </svg>
                    </div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Contact Information</h5>
                  </div>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="row g-3 g-md-4">
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start p-2 p-md-3 rounded" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                        <div
                          className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                            <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                          </svg>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <label className="text-muted small mb-1 d-block fw-semibold">Email Address</label>
                          <p className="mb-0 fw-bold text-truncate" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start p-2 p-md-3 rounded" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                        <div
                          className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                            <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122L9.05 10.5a.678.678 0 0 1-.555-.172l-2.715-2.714a.678.678 0 0 1-.172-.555l.122-.58L3.654 1.328zM1.884.511a1.936 1.936 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.936 1.936 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
                          </svg>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <label className="text-muted small mb-1 d-block fw-semibold">Phone Number</label>
                          <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{user.phone}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start p-2 p-md-3 rounded" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                        <div
                          className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                            <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                          </svg>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <label className="text-muted small mb-1 d-block fw-semibold">Location</label>
                          <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{user.location}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="d-flex align-items-start p-2 p-md-3 rounded" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                        <div
                          className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                          </svg>
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <label className="text-muted small mb-1 d-block fw-semibold">Last Login</label>
                          <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{user.lastLogin}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div
                className="card border-0 h-100"
                style={{
                  boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
                  borderRadius: '16px'
                }}
              >
                <div className="card-header bg-white border-bottom px-3 px-md-4 py-2 py-md-3" style={{ borderRadius: '16px 16px 0 0' }}>
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)',
                        boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16" className="d-md-none">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.326 4.81c-.083 0-.125-.018-.125-.125v-.126c0-.072.015-.12.125-.12.622 0 1.005.515 1.119.86a.25.25 0 0 1-.229.292h-.844zm.696-3.554c.08 0 .123.018.123.125v.126c0 .072-.015.12-.123.12h-.59c-.082 0-.123-.018-.123-.125v-.126c0-.072.015-.12.123-.12h.59z"/>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.326 4.81c-.083 0-.125-.018-.125-.125v-.126c0-.072.015-.12.125-.12.622 0 1.005.515 1.119.86a.25.25 0 0 1-.229.292h-.844zm.696-3.554c.08 0 .123.018.123.125v.126c0 .072-.015.12-.123.12h-.59c-.082 0-.123-.018-.123-.125v-.126c0-.072.015-.12.123-.12h.59z"/>
                      </svg>
                    </div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Subscription</h5>
                  </div>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="mb-3 mb-md-4">
                    <label className="text-muted small mb-2 d-block fw-semibold">Current Plan</label>
                    <span
                      className={`badge ${
                        user.plan === 'Premium'
                          ? 'bg-danger'
                          : user.plan === 'Pro'
                          ? 'bg-primary'
                          : 'bg-secondary'
                      }`}
                      style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)', padding: '0.5rem 1rem' }}
                    >
                      {user.plan}
                    </span>
                  </div>
                  <div className="mb-3 pb-3 border-bottom">
                    <label className="text-muted small mb-1 d-block fw-semibold">Billing Cycle</label>
                    <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>{user.billingCycle}</p>
                  </div>
                  <div className="mb-3 pb-3 border-bottom">
                    <label className="text-muted small mb-1 d-block fw-semibold">Next Billing Date</label>
                    <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>{user.nextBilling}</p>
                  </div>
                  <div>
                    <label className="text-muted small mb-1 d-block fw-semibold">Payment Method</label>
                    <p className="mb-0 fw-bold text-truncate" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{user.paymentMethod}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <div
                className="card border-0 h-100"
                style={{
                  boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
                  borderRadius: '16px'
                }}
              >
                <div className="card-header bg-white border-bottom px-3 px-md-4 py-2 py-md-3" style={{ borderRadius: '16px 16px 0 0' }}>
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
                        boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16" className="d-md-none">
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
                      </svg>
                    </div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Usage Statistics</h5>
                  </div>
                </div>
                <div className="card-body p-3 p-md-4">
                  <div className="mb-3 mb-md-4">
                    <label className="text-muted small mb-2 d-block fw-semibold">Total Projects</label>
                    <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', color: getPlanColor(user.plan) }}>{user.totalProjects}</p>
                  </div>
                  <div className="mb-3 mb-md-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="text-muted small mb-0 fw-semibold">Storage Usage</label>
                      <span className="fw-bold" style={{ color: getPlanColor(user.plan), fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{Math.round(storagePercentage)}%</span>
                    </div>
                    <div className="mb-2">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="fw-semibold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>{user.storageUsed}</span>
                        <span className="text-muted" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>{user.storageLimit}</span>
                      </div>
                      <div className="progress" style={{ height: '12px', borderRadius: '10px', overflow: 'hidden' }}>
                        <div
                          className="progress-bar"
                          role="progressbar"
                          style={{
                            width: `${storagePercentage}%`,
                            background: getPlanGradient(user.plan),
                            transition: 'width 0.6s ease'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mb-3 pb-3 border-bottom">
                    <label className="text-muted small mb-1 d-block fw-semibold">API Keys</label>
                    <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>{user.apiKeys} Active</p>
                  </div>
                  <div>
                    <label className="text-muted small mb-1 d-block fw-semibold">Member Since</label>
                    <p className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{user.joinDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div
                className="card border-0"
                style={{
                  boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
                  borderRadius: '16px'
                }}
              >
                <div className="card-header bg-white border-bottom px-3 px-md-4 py-2 py-md-3" style={{ borderRadius: '16px 16px 0 0' }}>
                  <div className="d-flex align-items-center">
                    <div
                      className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        boxShadow: '0 4px 15px rgba(67, 233, 123, 0.3)'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16" className="d-md-none">
                        <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                        <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                        <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                        <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                      </svg>
                    </div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Connected Integrations</h5>
                  </div>
                </div>
                <div className="card-body p-3 p-md-4">
                  {user.integrations.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2 gap-md-3">
                      {user.integrations.map((integration, index) => (
                        <div
                          key={index}
                          className="d-flex align-items-center px-3 px-md-4 py-2 py-md-3 rounded"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            border: '2px solid rgba(255, 140, 0, 0.2)',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (window.innerWidth > 768) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 0, 0.2)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <span className="fw-bold" style={{ color: getPlanColor(user.plan), fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>{integration}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="var(--light-gray)" viewBox="0 0 16 16" className="mb-3">
                        <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                        <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                      </svg>
                      <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>No integrations connected</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
