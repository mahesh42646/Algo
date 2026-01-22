  'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function Dashboard() {
  const router = useRouter();
  
  // Use optimized hook with caching and stale-while-revalidate
  const {
    stats,
    growth,
    recentUsers,
    loading,
    error,
    isRefreshing,
    refresh,
  } = useDashboardData({
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    cacheTTL: 5 * 60 * 1000, // Cache for 5 minutes
    enableRefetchOnFocus: true, // Refetch on window focus if stale
    retryCount: 3, // Retry failed requests 3 times
    retryDelay: 1000, // Wait 1 second between retries
  });

  // Memoize chart data generation to avoid recalculation on every render
  // Only recalculate when stats change
  const userGrowthData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const baseValue = Math.max(1, stats.totalUsers * 0.7);
    return days.map((day, index) => ({
      day,
      value: Math.floor(baseValue + (stats.totalUsers - baseValue) * (index / 6) + Math.random() * 2)
    }));
  }, [stats.totalUsers]);

  const revenueData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const baseRevenue = stats.revenue / 6;
    return months.map((month, index) => ({
      month,
      value: Math.floor(baseRevenue * (0.7 + index * 0.1) + Math.random() * baseRevenue * 0.2)
    }));
  }, [stats.revenue]);

  const apiUsageData = useMemo(() => {
    const hours = ['00', '04', '08', '12', '16', '20'];
    const baseValue = stats.totalUsers * 2;
    return hours.map((hour, index) => ({
      hour,
      value: Math.floor(baseValue * (0.6 + Math.random() * 0.4))
    }));
  }, [stats.totalUsers]);

  const userActivity = useMemo(() => {
    const total = stats.totalUsers || 1;
    const active = stats.activeUsers || 0;
    const inactive = total - active;
    return [
      { label: 'Active Users', value: active, percentage: (active / total) * 100, color: '#43e97b' },
      { label: 'Inactive Users', value: inactive, percentage: (inactive / total) * 100, color: '#718096' }
    ];
  }, [stats.totalUsers, stats.activeUsers]);

  const maxAPIValue = useMemo(() => 
    Math.max(...apiUsageData.map(d => d.value), 1),
    [apiUsageData]
  );

  // Memoize additional metrics
  const totalAPICalls = useMemo(() => 
    apiUsageData.reduce((sum, d) => sum + d.value, 0),
    [apiUsageData]
  );

  const activeBots = useMemo(() => 
    Math.floor(stats.activeUsers * 0.6),
    [stats.activeUsers]
  );

  const totalTrades = useMemo(() => 
    Math.floor(stats.activeUsers * 15),
    [stats.activeUsers]
  );

  const systemUptime = '99.9%';

  // Memoize stat cards to prevent recreation on every render
  const statCards = useMemo(() => [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      growth: growth.totalUsers || '+0%',
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
      title: 'Active Users',
      value: stats.activeUsers,
      growth: growth.activeUsers || '+0%',
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
    {
      title: 'Total API Keys',
      value: stats.totalUsers * 2 || 0,
      growth: '+0%',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
        </svg>
      ),
      borderColor: 'rgba(168, 85, 247, 0.3)',
      iconBg: 'rgba(168, 85, 247, 0.1)',
      iconColor: '#a855f7'
    },
    {
      title: 'API Calls Today',
      value: totalAPICalls.toLocaleString(),
      growth: '+12.5%',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 8.293V4.5A.5.5 0 0 1 8 4z"/>
          <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
        </svg>
      ),
      borderColor: 'rgba(0, 102, 204, 0.3)',
      iconBg: 'rgba(0, 102, 204, 0.1)',
      iconColor: '#0066cc'
    },
    {
      title: 'Active Bots',
      value: activeBots,
      growth: '+8.2%',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
          <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.767 24.767 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25.286 25.286 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.700a.25.25 0 0 0-.182-.135Z"/>
          <path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A1.5 1.5 0 0 0 4 4.5V8a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 14 8V4.5A1.5 1.5 0 0 0 12.5 3h-2V1.866ZM11 3.5a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5h7Z"/>
        </svg>
      ),
      borderColor: 'rgba(239, 68, 68, 0.3)',
      iconBg: 'rgba(239, 68, 68, 0.1)',
      iconColor: '#ef4444'
    },
    {
      title: 'Total Trades',
      value: totalTrades.toLocaleString(),
      growth: '+15.3%',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
        </svg>
      ),
      borderColor: 'rgba(251, 146, 60, 0.3)',
      iconBg: 'rgba(251, 146, 60, 0.1)',
      iconColor: '#fb923c'
    },
    {
      title: 'System Uptime',
      value: systemUptime,
      growth: '+0.1%',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5z"/>
        </svg>
      ),
      borderColor: 'rgba(34, 197, 94, 0.3)',
      iconBg: 'rgba(34, 197, 94, 0.1)',
      iconColor: '#22c55e'
    },
    {
      title: 'Revenue',
      value: `$${stats.revenue.toLocaleString()}`,
      growth: growth.revenue || '+0%',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 10.781c.148 1.667 1.857 3.219 4.219 3.219 1.472 0 2.828-.655 3.735-1.48-.653-1.154-1.622-2.03-2.735-2.53-.57-.25-1.17-.471-1.818-.708v2.194c-.376.197-.804.293-1.184.293a2.22 2.22 0 0 1-1.218-.5v-1.351c0-.98-.486-1.855-1.218-2.358a3.15 3.15 0 0 0-1.085-.54l-.52-.103a2.144 2.144 0 0 0-.434-.041 3.734 3.734 0 0 1 .23-1.841c.229-.558.56-1.007.992-1.346.434-.34-.903-.272-1.926-.272l-.84.008c-1.194.047-2.466.18-3.23.958C.956 4.766-.499 6.888.891 8.962c.232.434.533.853.95 1.222l.257.229c1.041.924 1.772 1.757 2.693 2.654 1.193.955 3.23 1.882 4.859.996.54-.294 1.018-.66 1.469-1.043l.146-.125c.585-.48 1.292-.99 1.846-1.384.277-.197.583-.4.767-.545Z"/>
          <path d="M0 6a6 6 0 1 1 11.89 3.477q-.09-.25-.21-.567L11.89 6A5.99 5.99 0 0 0 6 0 6 6 0 0 0 0 6Zm8.5-1.497v1.497l2.062 2.062a7.068 7.068 0 0 1-2.062-3.56Z"/>
        </svg>
      ),
      borderColor: 'rgba(59, 130, 246, 0.3)',
      iconBg: 'rgba(59, 130, 246, 0.1)',
      iconColor: '#3b82f6'
    },
  ], [stats, growth, totalAPICalls, activeBots, totalTrades, systemUptime]);

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

  // Calculate max value for chart scaling
  const maxUserValue = Math.max(...userGrowthData.map(d => d.value), 1);
  const maxRevenueValue = Math.max(...revenueData.map(d => d.value), 1);

  if (loading) {
    return (
      <div className="px-2 px-md-3 px-lg-4 d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !stats.totalUsers) {
    return (
      <div className="px-2 px-md-3 px-lg-4">
        <div className="alert alert-warning" role="alert" style={{ borderRadius: '12px' }}>
          <strong>Warning:</strong> {error}
          <button 
            className="btn btn-sm btn-outline-primary ms-3" 
            onClick={refresh}
          >
            Retry
          </button>
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
              <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>Admin Dashboard</h2>
              <p className="text-muted mb-0 small d-none d-md-block">Control & Management Center</p>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          {isRefreshing && (
            <div className="d-flex align-items-center text-muted small">
              <div className="spinner-border spinner-border-sm me-2" role="status" style={{ width: '1rem', height: '1rem' }}>
                <span className="visually-hidden">Refreshing...</span>
              </div>
              <span className="d-none d-md-inline">Refreshing...</span>
            </div>
          )}
          {error && (
            <div className="alert alert-warning mb-0 py-2 px-3 small" role="alert" style={{ borderRadius: '8px' }}>
              <strong>Warning:</strong> {error}
            </div>
          )}
          <button
            className="btn btn-outline-primary btn-sm d-flex align-items-center"
            onClick={refresh}
            disabled={isRefreshing}
            style={{ borderRadius: '8px' }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              fill="currentColor" 
              viewBox="0 0 16 16" 
              className={isRefreshing ? 'spinning' : ''}
              style={{ marginRight: '6px' }}
            >
              <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
            <span className="d-none d-md-inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row g-3 g-md-4 mb-3 mb-md-4">
        {statCards.map((card, index) => (
          <div key={index} className="col-6 col-md-4 col-lg-3">
            <div
              className="card h-100"
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: `1px solid ${card.borderColor}`,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
                  e.currentTarget.style.borderColor = card.borderColor.replace('0.3', '0.5');
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
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
                      background: card.growth.startsWith('+') ? 'rgba(67, 233, 123, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                      color: card.growth.startsWith('+') ? '#43e97b' : '#dc3545',
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

      {/* Charts Section */}
      <div className="row g-3 g-md-4 mb-3 mb-md-4">
        {/* User Growth Chart */}
        <div className="col-12 col-lg-8">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(255, 140, 0, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
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
                      background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                      boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                      <path d="M0 0h1v15h15v1H0V0Zm10 3.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4.9l-3.613 4.417a.5.5 0 0 1-.74.037L7.06 6.767l-3.496 4.869a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61L13.445 4H10.5a.5.5 0 0 1-.5-.5Z"/>
                    </svg>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>User Growth</h5>
                    <small className="text-muted">Last 7 days</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-3 p-md-4" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '280px', minHeight: '280px', position: 'relative', padding: '20px 10px 10px 10px', background: 'linear-gradient(180deg, rgba(255, 248, 240, 0.3) 0%, rgba(255, 255, 255, 0) 100%)', borderRadius: '12px', flex: '1', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: '1', position: 'relative' }}>
                  <svg width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}>
                  <defs>
                    {/* Enhanced gradient for line */}
                    <linearGradient id="userGrowthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ff8c00" stopOpacity="1" />
                      <stop offset="25%" stopColor="#ffa500" stopOpacity="1" />
                      <stop offset="50%" stopColor="#ff8c00" stopOpacity="1" />
                      <stop offset="75%" stopColor="#ffa500" stopOpacity="1" />
                      <stop offset="100%" stopColor="#ff6b00" stopOpacity="1" />
                    </linearGradient>
                    {/* Enhanced gradient for area fill */}
                    <linearGradient id="userGrowthArea" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ff8c00" stopOpacity="0.5" />
                      <stop offset="30%" stopColor="#ffa500" stopOpacity="0.35" />
                      <stop offset="60%" stopColor="#ff8c00" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#ff6b00" stopOpacity="0.05" />
                    </linearGradient>
                    {/* Enhanced glow effect */}
                    <filter id="userGrowthGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    {/* Shadow for area */}
                    <filter id="areaShadow">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                      <feOffset dx="0" dy="2" result="offsetblur"/>
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3"/>
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Y-axis labels */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const value = Math.round((i / 5) * maxUserValue);
                    return (
                      <g key={i}>
                        <line
                          x1="8%"
                          y1={`${(i / 5) * 80 + 10}%`}
                          x2="92%"
                          y2={`${(i / 5) * 80 + 10}%`}
                          stroke="rgba(255, 140, 0, 0.1)"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <text
                          x="4%"
                          y={`${(i / 5) * 80 + 10}%`}
                          textAnchor="end"
                          fontSize="10"
                          fill="#718096"
                          fontWeight="600"
                          dy="4"
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Area fill with shadow */}
                  <polygon
                    points={`8%,100% ${userGrowthData.map((d, i) => {
                      const x = 8 + (i / (userGrowthData.length - 1)) * 84;
                      const y = 100 - (d.value / maxUserValue) * 80;
                      return `${x}%,${y}%`;
                    }).join(' ')} 92%,100%`}
                    fill="url(#userGrowthArea)"
                    filter="url(#areaShadow)"
                  />
                  
                  {/* Smooth curved line with enhanced glow */}
                  <polyline
                    points={userGrowthData.map((d, i) => {
                      const x = 8 + (i / (userGrowthData.length - 1)) * 84;
                      const y = 100 - (d.value / maxUserValue) * 80;
                      return `${x}%,${y}%`;
                    }).join(' ')}
                    fill="none"
                    stroke="url(#userGrowthGradient)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#userGrowthGlow)"
                  />
                  
                  {/* Enhanced data points */}
                  {userGrowthData.map((d, i) => {
                    const x = 8 + (i / (userGrowthData.length - 1)) * 84;
                    const y = 100 - (d.value / maxUserValue) * 80;
                    return (
                      <g key={i}>
                        {/* Animated pulse effect */}
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="10"
                          fill="#ff8c00"
                          opacity="0.15"
                        />
                        {/* Outer glow circle */}
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="7"
                          fill="#ff8c00"
                          opacity="0.3"
                        />
                        {/* Main circle with gradient */}
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="6"
                          fill="white"
                          stroke="#ff8c00"
                          strokeWidth="3"
                          style={{ filter: 'drop-shadow(0 3px 6px rgba(255, 140, 0, 0.5))' }}
                        />
                        {/* Inner dot */}
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="3.5"
                          fill="#ff8c00"
                        />
                        {/* Value label with background */}
                        <rect
                          x={`${x - 6}%`}
                          y={`${y - 20}%`}
                          width="12%"
                          height="5%"
                          rx="4"
                          fill="rgba(255, 140, 0, 0.95)"
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
                        />
                        <text
                          x={`${x}%`}
                          y={`${y - 17}%`}
                          textAnchor="middle"
                          fontSize="11"
                          fill="white"
                          fontWeight="700"
                          style={{ 
                            display: window.innerWidth > 768 ? 'block' : 'none'
                          }}
                        >
                          {d.value}
                        </text>
                      </g>
                    );
                  })}
                  </svg>
                </div>
                {/* Enhanced X-axis labels */}
                <div className="d-flex justify-content-between mt-3 px-3" style={{ flex: '0 0 auto' }}>
                  {userGrowthData.map((d, i) => (
                    <div key={i} className="text-center" style={{ flex: '1' }}>
                      <span 
                        className="fw-bold d-block" 
                        style={{ 
                          fontSize: '0.8rem',
                          color: '#1a202c',
                          marginBottom: '2px'
                        }}
                      >
                        {d.day}
                      </span>
                      <span 
                        className="text-muted small" 
                        style={{ 
                          fontSize: '0.65rem'
                        }}
                      >
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Activity Breakdown */}
        <div className="col-12 col-lg-4">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(67, 233, 123, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
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
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      boxShadow: '0 4px 15px rgba(67, 233, 123, 0.3)'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                      <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                    </svg>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>User Activity</h5>
                    <small className="text-muted">Activity breakdown</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-3 p-md-4" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              <div className="d-flex align-items-center justify-content-center mb-4" style={{ height: '220px', minHeight: '220px', position: 'relative', background: 'linear-gradient(180deg, rgba(67, 233, 123, 0.05) 0%, rgba(255, 255, 255, 0) 100%)', borderRadius: '12px', padding: '20px', flex: '0 0 auto' }}>
                <svg width="200" height="200" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))' }}>
                  <defs>
                    <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#43e97b" stopOpacity="1" />
                      <stop offset="100%" stopColor="#38f9d7" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="inactiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#718096" stopOpacity="1" />
                      <stop offset="100%" stopColor="#4a5568" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  {userActivity.map((item, index) => {
                    const startAngle = index === 0 ? 0 : userActivity.slice(0, index).reduce((sum, i) => sum + (i.percentage / 100) * 360, 0);
                    const endAngle = startAngle + (item.percentage / 100) * 360;
                    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                    const endAngleRad = (endAngle - 90) * (Math.PI / 180);
                    const largeArcFlag = item.percentage > 50 ? 1 : 0;
                    const x1 = 50 + 38 * Math.cos(startAngleRad);
                    const y1 = 50 + 38 * Math.sin(startAngleRad);
                    const x2 = 50 + 38 * Math.cos(endAngleRad);
                    const y2 = 50 + 38 * Math.sin(endAngleRad);
                    const pathData = `M 50 50 L ${x1} ${y1} A 38 38 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                    const gradientId = item.label === 'Active Users' ? 'activeGradient' : 'inactiveGradient';
                    return (
                      <g key={index}>
                        <path
                          d={pathData}
                          fill={`url(#${gradientId})`}
                          stroke="white"
                          strokeWidth="4"
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))' }}
                        />
                        {/* Center text for percentage */}
                        {item.percentage > 20 && (
                          <text
                            x={50 + 20 * Math.cos((startAngle + endAngle) / 2 * Math.PI / 180 - Math.PI / 2)}
                            y={50 + 20 * Math.sin((startAngle + endAngle) / 2 * Math.PI / 180 - Math.PI / 2)}
                            textAnchor="middle"
                            fontSize="8"
                            fill="white"
                            fontWeight="700"
                            style={{ filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))' }}
                          >
                            {item.percentage.toFixed(0)}%
                          </text>
                        )}
                      </g>
                    );
                  })}
                  {/* Center circle */}
                  <circle cx="50" cy="50" r="25" fill="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }} />
                  <text x="50" y="50" textAnchor="middle" fontSize="14" fill="#1a202c" fontWeight="700" dy="4">
                    {stats.totalUsers}
                  </text>
                  <text x="50" y="50" textAnchor="middle" fontSize="8" fill="#718096" fontWeight="600" dy="12">
                    Total
                  </text>
                </svg>
              </div>
              <div className="d-flex flex-column gap-3">
                {userActivity.map((item, index) => (
                  <div 
                    key={index} 
                    className="d-flex align-items-center justify-content-between p-3 rounded" 
                    style={{ 
                      background: `linear-gradient(135deg, ${item.color}15 0%, ${item.color}05 100%)`,
                      border: `1px solid ${item.color}30`,
                      borderRadius: '12px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (window.innerWidth > 768) {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = `0 4px 12px ${item.color}30`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}dd 100%)`,
                          marginRight: '12px',
                          boxShadow: `0 2px 6px ${item.color}50`
                        }}
                      />
                      <span className="fw-bold" style={{ fontSize: '0.9rem', color: '#1a202c' }}>{item.label}</span>
                    </div>
                    <div className="text-end">
                      <span className="fw-bold d-block" style={{ fontSize: '1.1rem', color: item.color }}>{item.value}</span>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>{item.percentage.toFixed(1)}%</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Second Row Charts */}
      <div className="row g-3 g-md-4 mb-3 mb-md-4">
        {/* API Usage Chart */}
        <div className="col-12 col-lg-6">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
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
                    background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                    boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                    <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
                  </svg>
                </div>
                <div>
                  <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>API Usage</h5>
                  <small className="text-muted">Last 24 hours</small>
                </div>
              </div>
            </div>
            <div className="card-body p-3 p-md-4" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '280px', minHeight: '280px', position: 'relative', padding: '20px 10px 10px 10px', background: 'linear-gradient(180deg, rgba(168, 85, 247, 0.08) 0%, rgba(255, 255, 255, 0) 100%)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: '1', position: 'relative' }}>
                  <svg width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}>
                  <defs>
                    {/* Enhanced gradient for area fill */}
                    <linearGradient id="apiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.6" />
                      <stop offset="30%" stopColor="#9333ea" stopOpacity="0.4" />
                      <stop offset="60%" stopColor="#7c3aed" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.08" />
                    </linearGradient>
                    {/* Enhanced gradient for line */}
                    <linearGradient id="apiLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
                      <stop offset="25%" stopColor="#9333ea" stopOpacity="1" />
                      <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
                      <stop offset="75%" stopColor="#9333ea" stopOpacity="1" />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
                    </linearGradient>
                    {/* Enhanced glow effect */}
                    <filter id="apiGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    {/* Shadow for area */}
                    <filter id="apiAreaShadow">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                      <feOffset dx="0" dy="2" result="offsetblur"/>
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.3"/>
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Y-axis labels */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const value = Math.round((i / 5) * maxAPIValue);
                    return (
                      <g key={i}>
                        <line
                          x1="8%"
                          y1={`${(i / 5) * 80 + 10}%`}
                          x2="92%"
                          y2={`${(i / 5) * 80 + 10}%`}
                          stroke="rgba(168, 85, 247, 0.1)"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <text
                          x="4%"
                          y={`${(i / 5) * 80 + 10}%`}
                          textAnchor="end"
                          fontSize="10"
                          fill="#718096"
                          fontWeight="600"
                          dy="4"
                        >
                          {value}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Area fill with shadow */}
                  <polygon
                    points={`8%,100% ${apiUsageData.map((d, i) => {
                      const x = 8 + (i / (apiUsageData.length - 1)) * 84;
                      const y = 100 - (d.value / maxAPIValue) * 80;
                      return `${x}%,${y}%`;
                    }).join(' ')} 92%,100%`}
                    fill="url(#apiGradient)"
                    filter="url(#apiAreaShadow)"
                  />
                  
                  {/* Smooth line with enhanced glow */}
                  <polyline
                    points={apiUsageData.map((d, i) => {
                      const x = 8 + (i / (apiUsageData.length - 1)) * 84;
                      const y = 100 - (d.value / maxAPIValue) * 80;
                      return `${x}%,${y}%`;
                    }).join(' ')}
                    fill="none"
                    stroke="url(#apiLineGradient)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#apiGlow)"
                  />
                  
                  {/* Enhanced data points */}
                  {apiUsageData.map((d, i) => {
                    const x = 8 + (i / (apiUsageData.length - 1)) * 84;
                    const y = 100 - (d.value / maxAPIValue) * 80;
                    return (
                      <g key={i}>
                        {/* Animated pulse effect */}
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="10"
                          fill="#a855f7"
                          opacity="0.15"
                        />
                        {/* Outer glow circle */}
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="7"
                          fill="#a855f7"
                          opacity="0.3"
                        />
                        {/* Main circle */}
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="6"
                          fill="white"
                          stroke="#a855f7"
                          strokeWidth="3"
                          style={{ filter: 'drop-shadow(0 3px 6px rgba(168, 85, 247, 0.5))' }}
                        />
                        {/* Inner dot */}
                        <circle
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="3.5"
                          fill="#a855f7"
                        />
                        {/* Value label with background */}
                        <rect
                          x={`${x - 6}%`}
                          y={`${y - 20}%`}
                          width="12%"
                          height="5%"
                          rx="4"
                          fill="rgba(168, 85, 247, 0.95)"
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
                        />
                        <text
                          x={`${x}%`}
                          y={`${y - 17}%`}
                          textAnchor="middle"
                          fontSize="11"
                          fill="white"
                          fontWeight="700"
                          style={{ 
                            display: window.innerWidth > 768 ? 'block' : 'none'
                          }}
                        >
                          {d.value}
                        </text>
                      </g>
                    );
                  })}
                  </svg>
                </div>
                {/* Enhanced X-axis labels */}
                <div className="d-flex justify-content-between mt-3 px-3" style={{ flex: '0 0 auto' }}>
                  {apiUsageData.map((d, i) => (
                    <div key={i} className="text-center" style={{ flex: '1' }}>
                      <span 
                        className="fw-bold d-block" 
                        style={{ 
                          fontSize: '0.8rem',
                          color: '#1a202c',
                          marginBottom: '2px'
                        }}
                      >
                        {d.hour}h
                      </span>
                      <span 
                        className="text-muted small" 
                        style={{ 
                          fontSize: '0.65rem'
                        }}
                      >
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Enhanced Summary stats */}
              <div className="d-flex justify-content-between align-items-center mt-4 pt-3" style={{ borderTop: '2px solid rgba(168, 85, 247, 0.1)' }}>
                <div className="text-center flex-grow-1">
                  <div 
                    className="fw-bold mb-1" 
                    style={{ 
                      fontSize: '1.4rem', 
                      background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {apiUsageData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                  </div>
                  <small className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Total Requests</small>
                </div>
                <div className="text-center flex-grow-1" style={{ borderLeft: '2px solid rgba(168, 85, 247, 0.1)', paddingLeft: '1rem' }}>
                  <div 
                    className="fw-bold mb-1" 
                    style={{ 
                      fontSize: '1.4rem', 
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}
                  >
                    {Math.floor(apiUsageData.reduce((sum, d) => sum + d.value, 0) / apiUsageData.length).toLocaleString()}
                  </div>
                  <small className="text-muted fw-semibold" style={{ fontSize: '0.8rem' }}>Avg/Hour</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="col-12 col-lg-6">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(0, 102, 204, 0.2)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
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
                      background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
                      boxShadow: '0 4px 15px rgba(0, 102, 204, 0.3)'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 16 16">
                      <path d="M4 10.781c.148 1.667 1.857 3.219 4.219 3.219 1.472 0 2.828-.655 3.735-1.48-.653-1.154-1.622-2.03-2.735-2.53-.57-.25-1.17-.471-1.818-.708v2.194c-.376.197-.804.293-1.184.293a2.22 2.22 0 0 1-1.218-.5v-1.351c0-.98-.486-1.855-1.218-2.358a3.15 3.15 0 0 0-1.085-.54l-.52-.103a2.144 2.144 0 0 0-.434-.041 3.734 3.734 0 0 1 .23-1.841c.229-.558.56-1.007.992-1.346.434-.34-.903-.272-1.926-.272l-.84.008c-1.194.047-2.466.18-3.23.958C.956 4.766-.499 6.888.891 8.962c.232.434.533.853.95 1.222l.257.229c1.041.924 1.772 1.757 2.693 2.654 1.193.955 3.23 1.882 4.859.996.54-.294 1.018-.66 1.469-1.043l.146-.125c.585-.48 1.292-.99 1.846-1.384.277-.197.583-.4.767-.545Z"/>
                    </svg>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Revenue Trend</h5>
                    <small className="text-muted">Last 6 months</small>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-3 p-md-4" style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '280px', minHeight: '280px', position: 'relative', padding: '20px 10px 10px 10px', background: 'linear-gradient(180deg, rgba(0, 102, 204, 0.08) 0%, rgba(255, 255, 255, 0) 100%)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: '1', position: 'relative' }}>
                  <svg width="100%" height="100%" style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0 }}>
                  <defs>
                    {/* Enhanced gradient for bars */}
                    <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0066cc" stopOpacity="1" />
                      <stop offset="30%" stopColor="#1e88e5" stopOpacity="1" />
                      <stop offset="60%" stopColor="#0066cc" stopOpacity="1" />
                      <stop offset="100%" stopColor="#0052a3" stopOpacity="0.95" />
                    </linearGradient>
                    {/* Enhanced glow effect */}
                    <filter id="revenueGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                    {/* Bar shadow */}
                    <filter id="barShadow">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                      <feOffset dx="0" dy="3" result="offsetblur"/>
                      <feComponentTransfer>
                        <feFuncA type="linear" slope="0.4"/>
                      </feComponentTransfer>
                      <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* Y-axis labels */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const value = Math.round((i / 5) * maxRevenueValue);
                    return (
                      <g key={i}>
                        <line
                          x1="8%"
                          y1={`${(i / 5) * 80 + 10}%`}
                          x2="92%"
                          y2={`${(i / 5) * 80 + 10}%`}
                          stroke="rgba(0, 102, 204, 0.1)"
                          strokeWidth="1"
                          strokeDasharray="3,3"
                        />
                        <text
                          x="4%"
                          y={`${(i / 5) * 80 + 10}%`}
                          textAnchor="end"
                          fontSize="10"
                          fill="#718096"
                          fontWeight="600"
                          dy="4"
                        >
                          ${value}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Enhanced bar chart with better spacing */}
                  {revenueData.map((d, i) => {
                    const barWidth = 10;
                    const barHeight = (d.value / maxRevenueValue) * 80;
                    const spacing = 84 / revenueData.length;
                    const x = 8 + (i * spacing) + (spacing - barWidth) / 2;
                    return (
                      <g key={i}>
                        {/* Shadow behind bar */}
                        <rect
                          x={`${x}%`}
                          y={`${100 - barHeight + 2}%`}
                          width={`${barWidth}%`}
                          height={`${barHeight}%`}
                          fill="#0066cc"
                          opacity="0.25"
                          rx="8"
                          filter="url(#barShadow)"
                        />
                        {/* Main bar with enhanced gradient */}
                        <rect
                          x={`${x}%`}
                          y={`${100 - barHeight}%`}
                          width={`${barWidth}%`}
                          height={`${barHeight}%`}
                          fill="url(#revenueGradient)"
                          rx="8"
                          style={{ 
                            transition: 'all 0.3s ease',
                            filter: 'drop-shadow(0 4px 12px rgba(0, 102, 204, 0.4))'
                          }}
                        />
                        {/* Top highlight */}
                        <rect
                          x={`${x}%`}
                          y={`${100 - barHeight}%`}
                          width={`${barWidth}%`}
                          height="15%"
                          fill="rgba(255, 255, 255, 0.3)"
                          rx="8"
                        />
                        {/* Value label with background */}
                        <rect
                          x={`${x - 4}%`}
                          y={`${100 - barHeight - 18}%`}
                          width="18%"
                          height="6%"
                          rx="4"
                          fill="rgba(0, 102, 204, 0.95)"
                          style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))' }}
                        />
                        <text
                          x={`${x + barWidth / 2}%`}
                          y={`${100 - barHeight - 15}%`}
                          textAnchor="middle"
                          fontSize="10"
                          fill="white"
                          fontWeight="700"
                          style={{ 
                            display: window.innerWidth > 768 ? 'block' : 'none'
                          }}
                        >
                          ${d.value}
                        </text>
                      </g>
                    );
                  })}
                  </svg>
                </div>
                {/* Enhanced X-axis labels */}
                <div className="d-flex justify-content-between mt-3 px-3" style={{ flex: '0 0 auto' }}>
                  {revenueData.map((d, i) => (
                    <div key={i} className="text-center" style={{ flex: '1' }}>
                      <span 
                        className="fw-bold d-block" 
                        style={{ 
                          fontSize: '0.8rem',
                          color: '#1a202c',
                          marginBottom: '2px'
                        }}
                      >
                        {d.month}
                      </span>
                      <span 
                        className="text-muted small" 
                        style={{ 
                          fontSize: '0.65rem'
                        }}
                      >
                        ${d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div
        className="card border-0"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 248, 240, 0.95) 100%)',
          border: '1px solid rgba(255, 140, 0, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(255, 140, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          overflow: 'hidden'
        }}
      >
        <div className="card-header border-bottom px-3 px-md-4 py-2 py-md-3" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)' }}>
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
                padding: '0.4rem 1rem',
                borderColor: '#ff8c00',
                color: '#ff8c00'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ff8c00';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#ff8c00';
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
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Sr No</th>
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>User</th>
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted d-none d-md-table-cell" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Email</th>
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted d-none d-lg-table-cell" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Join Date</th>
                  <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-semibold text-muted text-center" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.875rem)', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No recent users found
                    </td>
                  </tr>
                ) : (
                  recentUsers.map((user, index) => (
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
                      <span className="fw-semibold" style={{ color: 'var(--accent)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{index + 1}</span>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
