'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Tickets() {
  const [tickets, setTickets] = useState([
    {
      id: 1,
      ticketNumber: 'TKT-001',
      user: { name: 'John Doe', email: 'john@example.com' },
      subject: 'Payment issue with subscription',
      description: 'I am unable to process my payment for the Premium plan. The payment gateway seems to be not responding.',
      status: 'Open',
      priority: 'High',
      category: 'Payment',
      createdAt: '2024-01-20 14:30:00',
      updatedAt: '2024-01-20 15:00:00',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      ticketNumber: 'TKT-002',
      user: { name: 'Jane Smith', email: 'jane@example.com' },
      subject: 'Feature request for dashboard',
      description: 'I would like to request a dark mode feature for the dashboard. It would be great for night-time usage.',
      status: 'In Progress',
      priority: 'Medium',
      category: 'Feature Request',
      createdAt: '2024-01-20 12:15:00',
      updatedAt: '2024-01-20 13:30:00',
      image: null
    },
    {
      id: 3,
      ticketNumber: 'TKT-003',
      user: { name: 'Bob Johnson', email: 'bob@example.com' },
      subject: 'Account login problem',
      description: 'I cannot log into my account. I keep getting an error message saying "Invalid credentials" even though I am using the correct password.',
      status: 'Open',
      priority: 'High',
      category: 'Technical',
      createdAt: '2024-01-20 10:45:00',
      updatedAt: '2024-01-20 10:45:00',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'
    },
    {
      id: 4,
      ticketNumber: 'TKT-004',
      user: { name: 'Alice Williams', email: 'alice@example.com' },
      subject: 'Billing inquiry',
      description: 'I need clarification on my billing statement. There seems to be a discrepancy in the charges.',
      status: 'Resolved',
      priority: 'Low',
      category: 'Billing',
      createdAt: '2024-01-19 16:20:00',
      updatedAt: '2024-01-20 09:00:00',
      image: null
    },
    {
      id: 5,
      ticketNumber: 'TKT-005',
      user: { name: 'Charlie Brown', email: 'charlie@example.com' },
      subject: 'Bug report - Dashboard not loading',
      description: 'The dashboard is not loading properly on mobile devices. I have attached a screenshot showing the issue.',
      status: 'Open',
      priority: 'High',
      category: 'Bug Report',
      createdAt: '2024-01-19 14:00:00',
      updatedAt: '2024-01-19 14:00:00',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop'
    },
    {
      id: 6,
      ticketNumber: 'TKT-006',
      user: { name: 'Diana Prince', email: 'diana@example.com' },
      subject: 'Subscription upgrade request',
      description: 'I would like to upgrade from Basic to Premium plan. Please assist me with the process.',
      status: 'In Progress',
      priority: 'Medium',
      category: 'Subscription',
      createdAt: '2024-01-19 11:30:00',
      updatedAt: '2024-01-19 15:20:00',
      image: null
    },
    {
      id: 7,
      ticketNumber: 'TKT-007',
      user: { name: 'Edward Norton', email: 'edward@example.com' },
      subject: 'Data export issue',
      description: 'I am unable to export my data. The export button is not working. Please see the attached screenshot.',
      status: 'Open',
      priority: 'Medium',
      category: 'Technical',
      createdAt: '2024-01-18 09:15:00',
      updatedAt: '2024-01-18 09:15:00',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop'
    },
    {
      id: 8,
      ticketNumber: 'TKT-008',
      user: { name: 'Fiona Apple', email: 'fiona@example.com' },
      subject: 'Password reset not working',
      description: 'I tried to reset my password but did not receive the reset email. Please help.',
      status: 'Resolved',
      priority: 'High',
      category: 'Account',
      createdAt: '2024-01-18 08:00:00',
      updatedAt: '2024-01-18 14:30:00',
      image: null
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(t => t.priority === filterPriority);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.ticketNumber.toLowerCase().includes(term) ||
        t.subject.toLowerCase().includes(term) ||
        t.user.name.toLowerCase().includes(term) ||
        t.user.email.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [tickets, filterStatus, filterPriority, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'Open').length,
      inProgress: tickets.filter(t => t.status === 'In Progress').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      highPriority: tickets.filter(t => t.priority === 'High').length
    };
  }, [tickets]);

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

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleStatusChange = (ticketId, newStatus) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status: newStatus, updatedAt: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) } : t
    ));
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
    if (ticket.status !== 'Open') {
      handleStatusChange(ticket.id, 'Open');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
  };

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showModal) {
        handleCloseModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showModal, handleCloseModal]);

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
                <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zm0 1h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5z"/>
                <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zm0 1h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5z"/>
                <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
              </svg>
            </div>
            <div>
              <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>Support Tickets</h2>
              <p className="text-muted mb-0 small d-none d-md-block">Manage and respond to user support tickets</p>
            </div>
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
                    <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zm0 1h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5z"/>
                    <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2', color: '#1a202c' }}>{stats.total}</h3>
              <p className="mb-0 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)', color: '#718096' }}>Total Tickets</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card border-0 text-white h-100"
            style={{
              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(220, 53, 69, 0.3)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 53, 69, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(220, 53, 69, 0.3)';
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
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.open}</h3>
              <p className="mb-0 opacity-90 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Open Tickets</p>
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
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.inProgress}</h3>
              <p className="mb-0 opacity-90 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>In Progress</p>
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
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.resolved}</h3>
              <p className="mb-0 opacity-90 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Resolved</p>
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
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
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
                  <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zm0 1h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5z"/>
                  <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                  <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zm0 1h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5z"/>
                  <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                </svg>
              </div>
              <div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Ticket List</h5>
                <small className="text-muted d-none d-md-inline">{filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'} found</small>
              </div>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
              <div className="input-group shadow-sm" style={{ maxWidth: '100%' }}>
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
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}
                />
              </div>
              <div className="d-flex flex-wrap gap-2 shadow-sm">
                <button
                  type="button"
                  className={`btn ${filterStatus === 'all' ? '' : 'btn-outline-'}primary`}
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                    padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.7rem, 2vw, 1rem)',
                    borderColor: filterStatus === 'all' ? 'transparent' : 'var(--primary)',
                    background: filterStatus === 'all' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'white',
                    color: filterStatus === 'all' ? 'white' : 'var(--primary)',
                    fontWeight: '600',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setFilterStatus('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn ${filterStatus === 'Open' ? '' : 'btn-outline-'}primary`}
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                    padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.7rem, 2vw, 1rem)',
                    borderColor: filterStatus === 'Open' ? 'transparent' : 'var(--primary)',
                    background: filterStatus === 'Open' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'white',
                    color: filterStatus === 'Open' ? 'white' : 'var(--primary)',
                    fontWeight: '600',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setFilterStatus('Open')}
                >
                  Open
                </button>
                <button
                  type="button"
                  className={`btn ${filterStatus === 'In Progress' ? '' : 'btn-outline-'}primary`}
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                    padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.7rem, 2vw, 1rem)',
                    borderColor: filterStatus === 'In Progress' ? 'transparent' : 'var(--primary)',
                    background: filterStatus === 'In Progress' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'white',
                    color: filterStatus === 'In Progress' ? 'white' : 'var(--primary)',
                    fontWeight: '600',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setFilterStatus('In Progress')}
                >
                  Progress
                </button>
                <button
                  type="button"
                  className={`btn ${filterStatus === 'Resolved' ? '' : 'btn-outline-'}primary`}
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                    padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.7rem, 2vw, 1rem)',
                    borderColor: filterStatus === 'Resolved' ? 'transparent' : 'var(--primary)',
                    background: filterStatus === 'Resolved' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'white',
                    color: filterStatus === 'Resolved' ? 'white' : 'var(--primary)',
                    fontWeight: '600',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={() => setFilterStatus('Resolved')}
                >
                  Resolved
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {filteredTickets.length > 0 ? (
            <div>
              {/* Desktop Table View */}
              <div className="table-responsive d-none d-md-block" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="table table-hover mb-0" style={{ minWidth: '800px', width: '100%' }}>
                <thead style={{ background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.1) 0%, rgba(0, 102, 204, 0.1) 100%)' }}>
                  <tr>
                    <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-bold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Ticket ID</th>
                    <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-bold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>User</th>
                    <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-bold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)', maxWidth: '120px', width: '120px' }}>Subject</th>
                    <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-bold d-none d-lg-table-cell" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)', maxWidth: '180px', width: '180px' }}>Message</th>
                    <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-bold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Status</th>
                    <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-bold d-none d-xl-table-cell" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Created</th>
                    <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-bold text-center d-none d-md-table-cell" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Image</th>
                    <th className="px-2 px-md-3 px-lg-4 py-2 py-md-3 fw-bold text-center" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      style={{
                        transition: 'all 0.3s ease',
                        borderBottom: '1px solid rgba(0,0,0,0.05)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (window.innerWidth > 768) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 140, 0, 0.03)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3">
                        <span className="fw-semibold" style={{ color: 'var(--accent)', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{ticket.ticketNumber}</span>
                      </td>
                      <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3">
                        <div className="d-flex align-items-center">
                          <div
                            className="d-flex align-items-center justify-content-center me-2 me-md-3 flex-shrink-0"
                            style={{
                              width: 'clamp(32px, 8vw, 36px)',
                              height: 'clamp(32px, 8vw, 36px)',
                              borderRadius: '10px',
                              background: getAvatarColor(ticket.user.name),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                          >
                            {getInitials(ticket.user.name)}
                          </div>
                          <div className="flex-grow-1 min-w-0">
                            <div className="fw-bold text-truncate" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.95rem)' }}>{ticket.user.name}</div>
                            <small className="text-muted d-none d-md-block">Member since {ticket.user.email}</small>
                            <small className="text-muted d-md-none text-truncate d-block" style={{ fontSize: '0.75rem' }}>{ticket.user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3" style={{ maxWidth: '120px', width: '120px' }}>
                        <div className="fw-semibold text-truncate" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.95rem)' }} title={ticket.subject}>{ticket.subject}</div>
                        <small className="text-muted d-lg-none text-truncate d-block" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>{ticket.description.substring(0, 30)}...</small>
                      </td>
                      <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3 d-none d-lg-table-cell" style={{ maxWidth: '180px', width: '180px' }}>
                        <p className="mb-0 text-truncate" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', color: '#6c757d' }} title={ticket.description}>{ticket.description}</p>
                      </td>
                      <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3">
                        <span
                          className={`badge ${
                            ticket.status === 'Open'
                              ? 'bg-danger'
                              : ticket.status === 'In Progress'
                              ? 'bg-warning'
                              : 'bg-success'
                          }`}
                          style={{
                            fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                            padding: '0.4rem 0.7rem',
                            borderRadius: '6px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3 d-none d-xl-table-cell">
                        <div className="d-flex align-items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="var(--accent)" viewBox="0 0 16 16" className="me-2 flex-shrink-0">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                          </svg>
                          <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{formatTimestamp(ticket.createdAt)}</span>
                        </div>
                      </td>
                      <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3 text-center d-none d-md-table-cell">
                        {ticket.image ? (
                          <div
                            className="d-inline-block"
                            style={{
                              padding: '3px',
                              background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 50%, #0066cc 100%)',
                              borderRadius: '8px',
                              boxShadow: '0 2px 6px rgba(255, 140, 0, 0.25)',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(ticket.image, '_blank');
                            }}
                            onMouseEnter={(e) => {
                              if (window.innerWidth > 768) {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(255, 140, 0, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 6px rgba(255, 140, 0, 0.25)';
                            }}
                          >
                            <div
                              style={{
                                width: 'clamp(40px, 10vw, 50px)',
                                height: 'clamp(30px, 8vw, 40px)',
                                borderRadius: '5px',
                                overflow: 'hidden',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <img
                                src={ticket.image}
                                alt="Ticket"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' }}>—</span>
                        )}
                      </td>
                      <td className="px-2 px-md-3 px-lg-4 py-2 py-md-3 text-center" style={{ width: 'auto', minWidth: '120px' }}>
                        <div className="d-flex gap-1 gap-md-2 justify-content-center align-items-center" style={{ flexWrap: 'nowrap' }}>
                          <button
                            className="btn btn-sm d-inline-flex align-items-center justify-content-center"
                            style={{
                              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: 'clamp(0.3rem, 1.5vw, 0.4rem) clamp(0.4rem, 1.5vw, 0.6rem)',
                              fontWeight: '600',
                              fontSize: 'clamp(0.65rem, 1.8vw, 0.8rem)',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 6px rgba(255, 140, 0, 0.3)',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewTicket(ticket);
                            }}
                            onMouseEnter={(e) => {
                              if (window.innerWidth > 768) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 0, 0.4)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 6px rgba(255, 140, 0, 0.3)';
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="clamp(14px, 3.5vw, 16px)" height="clamp(14px, 3.5vw, 16px)" fill="currentColor" viewBox="0 0 16 16" className="me-1 d-none d-sm-inline">
                              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                            </svg>
                            <span className="d-none d-sm-inline">View</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="clamp(16px, 4vw, 18px)" height="clamp(16px, 4vw, 18px)" fill="currentColor" viewBox="0 0 16 16" className="d-sm-none">
                              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                            </svg>
                          </button>
                          <div className="dropdown position-relative">
                            <button
                              className="btn btn-sm d-inline-flex align-items-center justify-content-center"
                              style={{
                                background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: 'clamp(0.35rem, 1.5vw, 0.5rem)',
                                width: 'clamp(28px, 7vw, 32px)',
                                height: 'clamp(28px, 7vw, 32px)',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 6px rgba(108, 117, 125, 0.3)',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(openDropdown === ticket.id ? null : ticket.id);
                              }}
                              title="Actions"
                              onMouseEnter={(e) => {
                                if (window.innerWidth > 768) {
                                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.1)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 117, 125, 0.4)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (openDropdown !== ticket.id) {
                                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(108, 117, 125, 0.3)';
                                }
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="clamp(16px, 4vw, 18px)" height="clamp(16px, 4vw, 18px)" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                              </svg>
                            </button>
                            {openDropdown === ticket.id && (
                              <div
                                className="dropdown-menu show position-absolute"
                                style={{
                                  minWidth: '180px',
                                  borderRadius: '10px',
                                  border: 'none',
                                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                  padding: '0.5rem',
                                  zIndex: 1050,
                                  right: '0',
                                  left: 'auto',
                                  marginTop: '0.5rem'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {ticket.status === 'Open' && (
                                  <button
                                    className="dropdown-item d-flex align-items-center"
                                    style={{
                                      padding: '0.6rem 1rem',
                                      borderRadius: '8px',
                                      fontSize: '0.9rem',
                                      transition: 'all 0.2s ease',
                                      border: 'none',
                                      background: 'transparent',
                                      width: '100%',
                                      textAlign: 'left'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(ticket.id, 'In Progress');
                                      setOpenDropdown(null);
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%)';
                                      e.currentTarget.style.color = '#43e97b';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent';
                                      e.currentTarget.style.color = '';
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                                      <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                                    </svg>
                                    Start Progress
                                  </button>
                                )}
                                {ticket.status !== 'Resolved' && (
                                  <button
                                    className="dropdown-item d-flex align-items-center"
                                    style={{
                                      padding: '0.6rem 1rem',
                                      borderRadius: '8px',
                                      fontSize: '0.9rem',
                                      transition: 'all 0.2s ease',
                                      border: 'none',
                                      background: 'transparent',
                                      width: '100%',
                                      textAlign: 'left'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(ticket.id, 'Resolved');
                                      setOpenDropdown(null);
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(32, 201, 151, 0.1) 100%)';
                                      e.currentTarget.style.color = '#28a745';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent';
                                      e.currentTarget.style.color = '';
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                                      <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                    </svg>
                                    Mark as Resolved
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              {/* Mobile Card View */}
              <div className="d-block d-md-none">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="card border-0 mb-3"
                    style={{
                      borderRadius: '12px',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div
                      className="text-white p-3 d-flex justify-content-between align-items-center"
                      style={{
                        background: ticket.status === 'Open'
                          ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                          : ticket.status === 'In Progress'
                          ? 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)'
                          : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        borderBottom: '1px solid rgba(255,255,255,0.2)'
                      }}
                    >
                      <div>
                        <h6 className="mb-0 fw-bold" style={{ fontSize: '0.9rem' }}>{ticket.ticketNumber}</h6>
                        <small className="opacity-90" style={{ fontSize: '0.75rem' }}>{ticket.subject}</small>
                      </div>
                      <span
                        className={`badge ${
                          ticket.status === 'Open'
                            ? 'bg-light text-danger'
                            : ticket.status === 'In Progress'
                            ? 'bg-light text-warning'
                            : 'bg-light text-success'
                        }`}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: '600'
                        }}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <div className="card-body p-3">
                      <div className="mb-3">
                        <div className="d-flex align-items-center mb-2">
                          <div
                            className="d-flex align-items-center justify-content-center me-2 flex-shrink-0"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '10px',
                              background: getAvatarColor(ticket.user.name),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.8rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                          >
                            {getInitials(ticket.user.name)}
                          </div>
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.9rem' }}>{ticket.user.name}</div>
                            <small className="text-muted" style={{ fontSize: '0.75rem' }}>{ticket.user.email}</small>
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block mb-1 fw-semibold">Description</small>
                        <p className="mb-0" style={{ fontSize: '0.85rem' }}>{ticket.description}</p>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block mb-1 fw-semibold">Created</small>
                        <div className="d-flex align-items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="var(--accent)" viewBox="0 0 16 16" className="me-2 flex-shrink-0">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                          </svg>
                          <span style={{ fontSize: '0.85rem' }}>{formatTimestamp(ticket.createdAt)}</span>
                        </div>
                      </div>

                      {ticket.image && (
                        <div className="mb-3">
                          <small className="text-muted d-block mb-2 fw-semibold">Attached Image</small>
                          <div
                            className="d-inline-block"
                            style={{
                              padding: '3px',
                              background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 50%, #0066cc 100%)',
                              borderRadius: '8px',
                              boxShadow: '0 2px 6px rgba(255, 140, 0, 0.25)',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(ticket.image, '_blank')}
                          >
                            <div
                              style={{
                                width: '100px',
                                height: '70px',
                                borderRadius: '5px',
                                overflow: 'hidden',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <img
                                src={ticket.image}
                                alt="Ticket"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="d-grid gap-2">
                        <button
                          className="btn btn-sm d-inline-flex align-items-center justify-content-center"
                          style={{
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            fontWeight: '600',
                            fontSize: '0.85rem',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)'
                          }}
                          onClick={() => handleViewTicket(ticket)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                          </svg>
                          View Details
                        </button>
                        <div className="dropdown position-relative">
                          <button
                            className="btn btn-sm d-inline-flex align-items-center justify-content-center w-100"
                            style={{
                              background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.5rem 1rem',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 8px rgba(108, 117, 125, 0.3)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === ticket.id ? null : ticket.id);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                              <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
                            </svg>
                            Actions
                          </button>
                          {openDropdown === ticket.id && (
                            <div
                              className="dropdown-menu show position-absolute w-100"
                              style={{
                                borderRadius: '10px',
                                border: 'none',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                padding: '0.5rem',
                                zIndex: 1050,
                                marginTop: '0.5rem'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ticket.status === 'Open' && (
                                <button
                                  className="dropdown-item d-flex align-items-center"
                                  style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s ease',
                                    border: 'none',
                                    background: 'transparent',
                                    width: '100%',
                                    textAlign: 'left'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(ticket.id, 'In Progress');
                                    setOpenDropdown(null);
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%)';
                                    e.currentTarget.style.color = '#43e97b';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '';
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                                  </svg>
                                  Start Progress
                                </button>
                              )}
                              {ticket.status !== 'Resolved' && (
                                <button
                                  className="dropdown-item d-flex align-items-center"
                                  style={{
                                    padding: '0.6rem 1rem',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s ease',
                                    border: 'none',
                                    background: 'transparent',
                                    width: '100%',
                                    textAlign: 'left'
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(ticket.id, 'Resolved');
                                    setOpenDropdown(null);
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(40, 167, 69, 0.1) 0%, rgba(32, 201, 151, 0.1) 100%)';
                                    e.currentTarget.style.color = '#28a745';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '';
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                                  </svg>
                                  Mark as Resolved
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="var(--light-gray)" viewBox="0 0 16 16" className="mb-3">
                <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zm0 1h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5z"/>
                <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
              </svg>
              <h5 className="text-muted mb-2">No tickets found</h5>
              <p className="text-muted small mb-0">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {showModal && selectedTicket && (
        <div 
          className="modal fade show d-block" 
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1050 }}
          onClick={handleCloseModal}
        >
          <div 
            className="modal-dialog modal-dialog-centered modal-dialog-scrollable"
            style={{ 
              maxWidth: '600px', 
              width: '95%',
              margin: '1rem auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-content border-0"
              style={{
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              }}
            >
              <div 
                className="modal-header border-0 pb-0"
                style={{
                  background: selectedTicket.status === 'Open'
                    ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
                    : selectedTicket.status === 'In Progress'
                    ? 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)'
                    : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  borderRadius: '16px 16px 0 0',
                  color: 'white'
                }}
              >
                <div className="w-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="modal-title fw-bold mb-1" style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
                        {selectedTicket.ticketNumber}
                      </h5>
                      <p className="mb-0 opacity-90" style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
                        {selectedTicket.subject}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={handleCloseModal}
                      aria-label="Close"
                      style={{ opacity: 0.9 }}
                    />
                  </div>
                  <div className="d-flex flex-wrap gap-2 mb-2">
                    <span
                      className="badge bg-light text-dark"
                      style={{
                        fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}
                    >
                      {selectedTicket.status}
                    </span>
                    <span
                      className="badge bg-light text-dark"
                      style={{
                        fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}
                    >
                      {selectedTicket.priority} Priority
                    </span>
                    <span
                      className="badge bg-light text-dark"
                      style={{
                        fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}
                    >
                      {selectedTicket.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-body p-3 p-md-4">
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                      style={{
                        width: 'clamp(48px, 12vw, 56px)',
                        height: 'clamp(48px, 12vw, 56px)',
                        borderRadius: '12px',
                        background: getAvatarColor(selectedTicket.user.name),
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      }}
                    >
                      {getInitials(selectedTicket.user.name)}
                    </div>
                    <div>
                      <h6 className="mb-1 fw-bold" style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)' }}>
                        {selectedTicket.user.name}
                      </h6>
                      <p className="mb-0 text-muted" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                        {selectedTicket.user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h6 className="fw-bold mb-2 d-flex align-items-center" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', color: 'var(--accent)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                      <path d="M2.5 1A1.5 1.5 0 0 0 1 2.5v11A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 13.5 1h-11zm0 1h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5z"/>
                      <path d="M3 4.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                    </svg>
                    Description
                  </h6>
                  <div 
                    className="p-3 rounded"
                    style={{ 
                      fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', 
                      lineHeight: '1.7', 
                      color: '#495057',
                      background: 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      maxHeight: '300px',
                      overflowY: 'auto',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    <p className="mb-0" style={{ margin: 0 }}>
                      {selectedTicket.description}
                    </p>
                  </div>
                </div>

                {selectedTicket.image && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-2 d-flex align-items-center" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', color: 'var(--accent)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                        <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                      </svg>
                      Attached Image
                    </h6>
                    <div
                      className="d-inline-block"
                      style={{
                        padding: '4px',
                        background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 50%, #0066cc 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(255, 140, 0, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => window.open(selectedTicket.image, '_blank')}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 140, 0, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 0, 0.3)';
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '400px',
                          height: 'auto',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          background: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <img
                          src={selectedTicket.image}
                          alt="Ticket attachment"
                          style={{
                            width: '100%',
                            height: 'auto',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <div className="p-3 rounded" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                      <small className="text-muted d-block mb-1 fw-semibold" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
                        Created
                      </small>
                      <div className="d-flex align-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="var(--accent)" viewBox="0 0 16 16" className="me-2 flex-shrink-0">
                          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                        </svg>
                        <span className="fw-semibold" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                          {formatTimestamp(selectedTicket.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 rounded" style={{ background: 'rgba(255, 140, 0, 0.05)' }}>
                      <small className="text-muted d-block mb-1 fw-semibold" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
                        Last Updated
                      </small>
                      <div className="d-flex align-items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="var(--accent)" viewBox="0 0 16 16" className="me-2 flex-shrink-0">
                          <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                        </svg>
                        <span className="fw-semibold" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                          {formatTimestamp(selectedTicket.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0 pb-3 pb-md-4 px-3 px-md-4 d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  {selectedTicket.status !== 'In Progress' && (
                    <button
                      type="button"
                      className="btn d-inline-flex align-items-center"
                      onClick={() => {
                        const newStatus = 'In Progress';
                        handleStatusChange(selectedTicket.id, newStatus);
                        setSelectedTicket(prev => ({
                          ...prev,
                          status: newStatus,
                          updatedAt: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        }));
                      }}
                      style={{
                        borderRadius: '8px',
                        padding: '0.5rem 1.25rem',
                        fontWeight: '600',
                        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                        background: 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
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
                        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                      </svg>
                      In Progress
                    </button>
                  )}
                  {selectedTicket.status !== 'Resolved' && (
                    <button
                      type="button"
                      className="btn d-inline-flex align-items-center"
                      onClick={() => {
                        const newStatus = 'Resolved';
                        handleStatusChange(selectedTicket.id, newStatus);
                        setSelectedTicket(prev => ({
                          ...prev,
                          status: newStatus,
                          updatedAt: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        }));
                      }}
                      style={{
                        borderRadius: '8px',
                        padding: '0.5rem 1.25rem',
                        fontWeight: '600',
                        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                        background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(67, 233, 123, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(67, 233, 123, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(67, 233, 123, 0.3)';
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      </svg>
                      Resolved
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseModal}
                  style={{
                    borderRadius: '8px',
                    padding: '0.5rem 1.5rem',
                    fontWeight: '600',
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

