  'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 1248,
    activePlans: 892,
    revenue: 45678,
    activeUsers: 1024
  });

  const [recentUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', plan: 'Premium', joinDate: '2024-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', plan: 'Pro', joinDate: '2024-01-14' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', plan: 'Basic', joinDate: '2024-01-13' },
    { id: 4, name: 'Alice Williams', email: 'alice@example.com', plan: 'Premium', joinDate: '2024-01-12' },
    { id: 5, name: 'Charlie Brown', email: 'charlie@example.com', plan: 'Pro', joinDate: '2024-01-11' },
  ]);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      growth: '+12.5%',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
        </svg>
      ),
      borderColor: 'rgba(255, 140, 0, 0.3)',
      iconBg: 'rgba(255, 140, 0, 0.1)',
      iconColor: '#ff8c00'
    },
    {
      title: 'Active Plans',
      value: stats.activePlans,
      growth: '+8.2%',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.326 4.81c-.083 0-.125-.018-.125-.125v-.126c0-.072.015-.12.125-.12.622 0 1.005.515 1.119.86a.25.25 0 0 1-.229.292h-.844zm.696-3.554c.08 0 .123.018.123.125v.126c0 .072-.015.12-.123.12h-.59c-.082 0-.123-.018-.123-.125v-.126c0-.072.015-.12.123-.12h.59z"/>
        </svg>
      ),
      borderColor: 'rgba(255, 165, 0, 0.3)',
      iconBg: 'rgba(255, 165, 0, 0.1)',
      iconColor: '#ffa500'
    },
    {
      title: 'Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      growth: '+15.3%',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 10.781c.148 1.667 1.857 3.219 4.219 3.219 1.472 0 2.828-.655 3.735-1.48-.653-1.154-1.622-2.03-2.735-2.53-.57-.25-1.17-.471-1.818-.708v2.194c-.376.197-.804.293-1.184.293a2.22 2.22 0 0 1-1.218-.5v-1.351c0-.98-.486-1.855-1.218-2.358a3.15 3.15 0 0 0-1.085-.54l-.52-.103a2.144 2.144 0 0 0-.434-.041 3.734 3.734 0 0 1 .23-1.841c.229-.558.56-1.007.992-1.346.434-.34-.903-.272-1.926-.272l-.84.008c-1.194.047-2.466.18-3.23.958C.956 4.766-.499 6.888.891 8.962c.232.434.533.853.95 1.222l.257.229c1.041.924 1.772 1.757 2.693 2.654 1.193.955 3.23 1.882 4.859.996.54-.294 1.018-.66 1.469-1.043l.146-.125c.585-.48 1.292-.99 1.846-1.384.277-.197.583-.4.767-.545Z"/>
          <path d="M0 6a6 6 0 1 1 11.89 3.477q-.09-.25-.21-.567L11.89 6A5.99 5.99 0 0 0 6 0 6 6 0 0 0 0 6Zm8.5-1.497v1.497l2.062 2.062a7.068 7.068 0 0 1-2.062-3.56Z"/>
        </svg>
      ),
      borderColor: 'rgba(0, 102, 204, 0.3)',
      iconBg: 'rgba(0, 102, 204, 0.1)',
      iconColor: '#0066cc'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      growth: '+5.7%',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
        </svg>
      ),
      borderColor: 'rgba(67, 233, 123, 0.3)',
      iconBg: 'rgba(67, 233, 123, 0.1)',
      iconColor: '#43e97b'
    },
  ];

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

  return (
    <div className="px-2 px-md-3 px-lg-4" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-3 mb-md-4 gap-3">
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
                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
              </svg>
            </div>
            <div>
              <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>Overview</h2>
              <p className="text-muted mb-0 small d-none d-md-block">Welcome back! Here's what's happening today.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 g-md-4 mb-3 mb-md-4">
        {statCards.map((card, index) => (
          <div key={index} className="col-6 col-lg-3">
            <div
              className="card h-100"
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: `1px solid ${card.borderColor}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.borderColor = card.borderColor.replace('0.3', '0.5');
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.borderColor = card.borderColor;
              }}
            >
              <div className="card-body p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-start mb-2 mb-md-3">
                  <div
                    style={{
                      width: 'clamp(40px, 10vw, 56px)',
                      height: 'clamp(40px, 10vw, 56px)',
                      borderRadius: '12px',
                      background: card.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ color: card.iconColor }}>
                      {card.icon}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(0, 0, 0, 0.05)',
                      color: '#4a5568',
                      fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontWeight: '600'
                    }}
                  >
                    {card.growth}
                  </span>
                </div>
                <h3 className="fw-bold mb-1 mb-md-2" style={{ fontSize: 'clamp(1.25rem, 5vw, 2rem)', lineHeight: '1.2', color: '#1a202c' }}>{card.value}</h3>
                <p className="mb-0 fw-medium" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.95rem)', color: '#718096' }}>{card.title}</p>
              </div>
            </div>
          </div>
        ))}
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
                  <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                  <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                </svg>
              </div>
              <div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Recent Users</h5>
                <small className="text-muted d-none d-md-inline">Latest registered users</small>
              </div>
            </div>
            <button
              className="btn btn-sm btn-outline-primary w-100 w-md-auto"
              onClick={() => router.push('/admin/dashboard/users')}
              style={{
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.8rem',
                padding: '0.4rem 1rem'
              }}
            >
              View All
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead>
                <tr style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>ID</th>
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>User</th>
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted d-none d-md-table-cell" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Email</th>
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Plan</th>
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted d-none d-lg-table-cell" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Join Date</th>
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted text-center" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr
                    key={user.id}
                    style={{
                      transition: 'all 0.3s ease',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 140, 0, 0.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => router.push(`/admin/dashboard/users/${user.id}`)}
                  >
                    <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3">
                      <span className="fw-semibold" style={{ color: 'var(--accent)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>#{user.id}</span>
                    </td>
                    <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3">
                      <div className="d-flex align-items-center">
                        <div
                          className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: getAvatarColor(user.name),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div className="flex-grow-1 min-w-0">
                          <div className="fw-bold text-truncate" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>{user.name}</div>
                          <small className="text-muted d-none d-md-block">Member</small>
                          <small className="text-muted d-md-none text-truncate d-block" style={{ fontSize: '0.75rem' }}>{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3 d-none d-md-table-cell">
                      <div className="d-flex align-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="var(--accent)" viewBox="0 0 16 16" className="me-2 flex-shrink-0">
                          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
                        </svg>
                        <span className="text-truncate d-block" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', maxWidth: '200px' }}>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3">
                      <span
                        className={`badge ${
                          user.plan === 'Premium'
                            ? 'bg-danger'
                            : user.plan === 'Pro'
                            ? 'bg-primary'
                            : 'bg-secondary'
                        }`}
                        style={{
                          fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                          padding: '0.4rem 0.7rem',
                          borderRadius: '6px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3 d-none d-lg-table-cell">
                      <div className="d-flex align-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="var(--accent)" viewBox="0 0 16 16" className="me-2 flex-shrink-0">
                          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                        </svg>
                        <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{user.joinDate}</span>
                      </div>
                    </td>
                    <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3 text-center">
                      <button
                        className="btn btn-sm d-inline-flex align-items-center justify-content-center"
                        style={{
                          background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.4rem 0.8rem',
                          fontWeight: '600',
                          fontSize: 'clamp(0.7rem, 2vw, 0.875rem)',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/dashboard/users/${user.id}`);
                        }}
                        onMouseEnter={(e) => {
                          if (window.innerWidth > 768) {
                            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 0, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0) scale(1)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 140, 0, 0.3)';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1 d-none d-sm-inline">
                          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                        </svg>
                        <span className="d-none d-sm-inline">View</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="d-sm-none">
                          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
