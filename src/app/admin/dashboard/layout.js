'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem('adminAuth');
    if (!auth) {
      router.push('/admin');
    }

    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
      if (width <= 768) {
        setSidebarOpen(false);
      } else if (width > 768 && width <= 992) {
        // Tablet: sidebar can be open but smaller
        setSidebarOpen(true);
      } else {
        // Desktop: sidebar open by default
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    router.push('/admin');
  };

  if (!mounted) return null;

  const navItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
        </svg>
      )
    },
    {
      path: '/admin/dashboard/users',
      label: 'User List',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
        </svg>
      )
    },
    {
      path: '/admin/dashboard/referrals',
      label: 'Referrals',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2z"/>
        </svg>
      )
    },
    {
      path: '/admin/dashboard/notification',
      label: 'Notifications',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
        </svg>
      )
    },
    {
      path: '/admin/dashboard/tickets',
      label: 'Tickets',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zm0 1h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5z"/>
          <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
        </svg>
      )
    },
    {
      path: '/admin/dashboard/news',
      label: 'News',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
        </svg>
      )
    },
    {
      path: '/admin/dashboard/plans',
      label: 'Our Plans',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.326 4.81c-.083 0-.125-.018-.125-.125v-.126c0-.072.015-.12.125-.12.622 0 1.005.515 1.119.86a.25.25 0 0 1-.229.292h-.844zm.696-3.554c.08 0 .123.018.123.125v.126c0 .072-.015.12-.123.12h-.59c-.082 0-.123-.018-.123-.125v-.126c0-.072.015-.12.123-.12h.59z"/>
        </svg>
      )
    },
    {
      path: '/admin/dashboard/setting',
      label: 'Settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
        </svg>
      )
    },
  ];

  return (
    <>
      <style>{`
        .sidebar-transition {
          transition: transform 0.3s ease, width 0.3s ease !important;
        }

        .nav-link-hover {
          transition: all 0.3s ease !important;
        }

        .nav-link-hover:hover {
          transform: translateX(4px) !important;
        }

        .sidebar-overlay {
          backdrop-filter: blur(2px);
        }

        @media (max-width: 767.98px) {
          .sidebar-mobile {
            transform: translateX(-100%) !important;
          }

          .sidebar-mobile.open {
            transform: translateX(0) !important;
          }
        }
      `}</style>
      <div className="d-flex min-vh-100" style={{ background: 'var(--bg-light)' }}>
      {sidebarOpen && isMobile && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 sidebar-overlay"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`bg-white shadow-sm border-end position-fixed top-0 start-0 h-100 sidebar-transition ${isMobile ? (sidebarOpen ? 'sidebar-mobile open' : 'sidebar-mobile') : ''}`}
        style={{
          width: isMobile ? '280px' : (sidebarOpen ? '280px' : '80px'),
          zIndex: 1000,
          transform: isMobile && !sidebarOpen ? 'translateX(-100%)' : 'translateX(0)',
          maxWidth: isMobile ? '85vw' : '280px',
          boxShadow: sidebarOpen ? '2px 0 10px rgba(0,0,0,0.1)' : 'none'
        }}
      >
        <div className="d-flex flex-column h-100">
          {/* Admin Panel Header */}
          <div
            className="d-flex align-items-center justify-content-between px-3 py-3 border-bottom"
            style={{
              background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
              minHeight: '70px',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}
          >
            {sidebarOpen ? (
              <>
                <div className="d-flex align-items-center flex-grow-1">
                  <div
                    className="d-flex align-items-center justify-content-center me-2 flex-shrink-0"
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                    </svg>
                  </div>
                  <div className="flex-grow-1 min-w-0">
                    <h5 className="mb-0 fw-bold text-white text-truncate" style={{ fontSize: 'clamp(0.85rem, 2vw, 1.1rem)', lineHeight: '1.2' }}>
                      Admin Panel
                    </h5>
                    <small className="text-white opacity-90 d-block text-truncate" style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)' }}>
                      Control Center
                    </small>
                  </div>
                </div>
                <button
                  className="btn btn-link p-1 d-flex align-items-center justify-content-center"
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    minWidth: '32px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'rotate(90deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'rotate(0deg)';
                  }}
                  title="Close Sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                  </svg>
                </button>
              </>
            ) : (
              <div className="w-100 d-flex justify-content-center">
                <button
                  className="btn btn-link p-1 d-flex align-items-center justify-content-center"
                  onClick={() => setSidebarOpen(true)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Open Sidebar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          <nav className="flex-grow-1 px-3 pt-3" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/admin/dashboard' && pathname.startsWith(item.path + '/'));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`d-flex align-items-center text-decoration-none mb-2 rounded ${!isActive ? 'nav-link-hover' : ''}`}
                  onClick={() => {
                    if (isMobile && sidebarOpen) {
                      setSidebarOpen(false);
                    }
                  }}
                  style={{
                    padding: 'clamp(0.75rem, 2vw, 0.875rem) clamp(0.875rem, 2vw, 1rem)',
                    backgroundColor: isActive ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'transparent',
                    background: isActive ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'transparent',
                    color: isActive ? 'white' : '#4a5568',
                    borderRadius: '12px',
                    boxShadow: isActive ? '0 4px 15px rgba(255, 140, 0, 0.4)' : 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 140, 0, 0.1)';
                    } else {
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 140, 0, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    } else {
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 140, 0, 0.4)';
                    }
                  }}
                >
                  <span
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      minWidth: '24px',
                      width: '24px',
                      height: '24px',
                      marginRight: sidebarOpen ? '12px' : '0',
                      opacity: isActive ? 1 : 0.7
                    }}
                  >
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <span className="fw-semibold text-truncate" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          
          <div className="px-3 pb-4">
            <button
              onClick={handleLogout}
              className="btn w-100 d-flex align-items-center justify-content-center"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '0.875rem 1rem',
                fontWeight: '600',
                fontSize: '0.95rem',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.3)';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className={sidebarOpen ? 'me-2' : ''}>
                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
              </svg>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      <div
        className="flex-grow-1"
        style={{
          marginLeft: isMobile ? '0' : (sidebarOpen ? '280px' : '80px'),
          transition: 'margin-left 0.3s ease',
          width: '100%',
          minHeight: '100vh'
        }}
      >
        <header
          className="bg-white shadow-sm border-bottom sticky-top"
          style={{ 
            zIndex: 999, 
            height: '70px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 248, 240, 1) 100%)'
          }}
        >
          <div className="d-flex align-items-center justify-content-between h-100 px-3 px-md-4 px-lg-5">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-link p-0 text-decoration-none d-md-none me-3"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                type="button"
                style={{
                  color: '#ff8c00',
                  border: 'none',
                  background: 'transparent',
                  transition: 'all 0.3s ease',
                  minWidth: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ff6b00';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#ff8c00';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                </svg>
              </button>
              <div>
                <h4 className="mb-0 fw-bold text-truncate" style={{ 
                  color: 'var(--primary)', 
                  fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                  background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  lineHeight: '1.2'
                }}>
                  Admin Dashboard
                </h4>
                <small className="text-muted d-none d-md-block text-truncate" style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)' }}>
                  Control & Management Center
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 gap-md-3">
              <div className="text-muted d-none d-lg-block text-end">
                <div className="fw-semibold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.9rem)', color: '#4a5568' }}>Welcome back</div>
                <small style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.75rem)' }}>Admin User</small>
              </div>
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: 'clamp(36px, 9vw, 40px)',
                  height: 'clamp(36px, 9vw, 40px)',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                  boxShadow: '0 2px 8px rgba(255, 140, 0, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 140, 0, 0.2)';
                }}
              >
                <span className="fw-bold text-white" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>A</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-2 p-md-3 p-lg-4" style={{ 
          minHeight: 'calc(100vh - 70px)',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden'
        }}>
          {children}
        </main>
      </div>

    </div>
    </>
  );
}

