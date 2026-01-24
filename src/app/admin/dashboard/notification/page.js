'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { notificationsAPI } from '@/utils/api';

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'new_user',
      title: 'New User Registration',
      message: 'John Doe has successfully registered with Premium plan',
      user: { name: 'John Doe', email: 'john@example.com', plan: 'Premium' },
      timestamp: '2024-01-20 14:30:00',
      status: 'sent',
      scheduled: false,
      createdByAdmin: false
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment Received',
      message: 'Payment of $59.99 received from Jane Smith for Premium subscription',
      user: { name: 'Jane Smith', email: 'jane@example.com', plan: 'Premium' },
      timestamp: '2024-01-20 12:15:00',
      status: 'sent',
      scheduled: false,
      createdByAdmin: false
    },
    {
      id: 3,
      type: 'new_user',
      title: 'New User Registration',
      message: 'Bob Johnson has successfully registered with Pro plan',
      user: { name: 'Bob Johnson', email: 'bob@example.com', plan: 'Pro' },
      timestamp: '2024-01-20 10:45:00',
      status: 'processing',
      scheduled: false,
      createdByAdmin: false
    },
    {
      id: 4,
      type: 'payment',
      title: 'Payment Failed',
      message: 'Payment attempt failed for Alice Williams - Premium subscription',
      user: { name: 'Alice Williams', email: 'alice@example.com', plan: 'Premium' },
      timestamp: '2024-01-20 09:30:00',
      status: 'failed',
      scheduled: false,
      createdByAdmin: false
    },
    {
      id: 5,
      type: 'new_user',
      title: 'New User Registration',
      message: 'Charlie Brown has successfully registered with Basic plan',
      user: { name: 'Charlie Brown', email: 'charlie@example.com', plan: 'Basic' },
      timestamp: '2024-01-19 16:20:00',
      status: 'sent',
      scheduled: false,
      createdByAdmin: false
    },
    {
      id: 6,
      type: 'payment',
      title: 'Payment Received',
      message: 'Payment of $29.99 received from Diana Prince for Pro subscription',
      user: { name: 'Diana Prince', email: 'diana@example.com', plan: 'Pro' },
      timestamp: '2024-01-19 14:00:00',
      status: 'sent',
      scheduled: false,
      createdByAdmin: false
    },
    {
      id: 7,
      type: 'new_user',
      title: 'Welcome to Our Platform',
      message: 'Thank you for joining! Explore our premium features and get started today.',
      user: { name: 'All Users', email: 'all@example.com', plan: 'All Plans' },
      timestamp: '2024-01-21 10:00:00',
      status: null,
      scheduled: false,
      createdByAdmin: true
    },
    {
      id: 8,
      type: 'payment',
      title: 'Payment Reminder',
      message: 'Your subscription is expiring soon. Renew now to continue enjoying our services.',
      user: { name: 'Premium Users', email: 'premium@example.com', plan: 'Premium' },
      timestamp: '2024-01-22 09:00:00',
      status: null,
      scheduled: true,
      createdByAdmin: true
    },
    {
      id: 9,
      type: 'payment',
      title: 'Special Offer Available',
      message: 'Limited time offer: Get 20% off on annual subscriptions. Act now!',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
      user: { name: 'All Users', email: 'all@example.com', plan: 'All Plans' },
      timestamp: '2024-01-20 15:00:00',
      status: 'sent',
      scheduled: false,
      createdByAdmin: true
    },
    {
      id: 10,
      type: 'new_user',
      title: 'System Maintenance Notice',
      message: 'Scheduled maintenance on January 25th from 2 AM to 4 AM. Services may be temporarily unavailable.',
      user: { name: 'All Users', email: 'all@example.com', plan: 'All Plans' },
      timestamp: '2024-01-20 11:00:00',
      status: 'failed',
      scheduled: false,
      createdByAdmin: true
    },
  ]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await notificationsAPI.getAll();
        
        if (response.success) {
          // Transform backend notifications to match frontend format
          const transformedNotifications = (response.data || []).map((notif, index) => ({
            id: notif.id || index + 1,
            type: notif.type === 'success' ? 'new_user' : notif.type === 'error' ? 'payment' : 'info',
            title: notif.title,
            message: notif.message,
            user: {
              name: notif.userName || 'User',
              email: notif.userEmail || 'N/A',
              plan: 'Basic'
            },
            timestamp: notif.createdAt ? new Date(notif.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }).replace(',', '') : new Date().toLocaleString(),
            status: notif.read ? 'sent' : 'processing',
            scheduled: false,
            createdByAdmin: false
          }));
          
          setNotifications(transformedNotifications);
        } else {
          setError(response.error || 'Failed to load notifications');
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError(err.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    message: '',
    recipient: 'all',
    scheduleType: 'immediate',
    scheduledDate: '',
    scheduledTime: '',
    image: null,
    imagePreview: null
  });

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (filterType === 'admin') {
      filtered = filtered.filter(n => n.createdByAdmin === true);
    } else if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(term) ||
        n.message.toLowerCase().includes(term) ||
        n.user.name.toLowerCase().includes(term) ||
        n.user.email.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [notifications, filterType, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: notifications.length,
      sent: notifications.filter(n => n.status === 'sent').length,
      scheduled: notifications.filter(n => n.scheduled === true || n.status === 'scheduled').length,
      adminCreated: notifications.filter(n => n.createdByAdmin === true).length,
      processing: notifications.filter(n => n.status === 'processing').length,
      failed: notifications.filter(n => n.status === 'failed').length
    };
  }, [notifications]);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateNotification = (e) => {
    e.preventDefault();
    const newNotification = {
      id: notifications.length + 1,
      type: formData.type,
      title: formData.title,
      message: formData.message,
      image: formData.imagePreview,
      user: formData.recipient === 'all' 
        ? { name: 'All Users', email: 'all@example.com', plan: 'All Plans' }
        : formData.recipient === 'premium'
        ? { name: 'Premium Users', email: 'premium@example.com', plan: 'Premium' }
        : formData.recipient === 'pro'
        ? { name: 'Pro Users', email: 'pro@example.com', plan: 'Pro' }
        : formData.recipient === 'basic'
        ? { name: 'Basic Users', email: 'basic@example.com', plan: 'Basic' }
        : { name: 'Selected User', email: 'user@example.com', plan: 'Premium' },
      timestamp: formData.scheduleType === 'immediate' 
        ? new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : `${formData.scheduledDate} ${formData.scheduledTime}`,
      status: formData.scheduleType === 'immediate' ? 'processing' : null,
      scheduled: formData.scheduleType === 'scheduled',
      createdByAdmin: true
    };
    setNotifications([newNotification, ...notifications]);
    setShowCreateModal(false);
    setFormData({
      type: '',
      title: '',
      message: '',
      recipient: 'all',
      scheduleType: 'immediate',
      scheduledDate: '',
      scheduledTime: '',
      image: null,
      imagePreview: null
    });
    
    // Simulate status change for immediate notifications
    if (formData.scheduleType === 'immediate') {
      setTimeout(() => {
        setNotifications(prev => prev.map(n => 
          n.id === newNotification.id ? { ...n, status: 'sent' } : n
        ));
      }, 2000);
    }
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

  if (loading) {
    return (
      <div className="px-2 px-md-3 px-lg-4 d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Loading notifications...</p>
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
    <>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
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
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
              </svg>
            </div>
            <div>
              <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>Notifications</h2>
              <p className="text-muted mb-0 small d-none d-md-block">Manage user notifications and alerts</p>
            </div>
          </div>
        </div>
        <button
          className="btn d-flex align-items-center justify-content-center"
          style={{
            background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '0.6rem 1.2rem',
            fontWeight: '600',
            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
            boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
          }}
          onClick={() => setShowCreateModal(true)}
          onMouseEnter={(e) => {
            if (window.innerWidth > 768) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 140, 0, 0.4)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 140, 0, 0.3)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="me-2">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          <span className="d-none d-sm-inline">Create Notification</span>
          <span className="d-sm-none">Create</span>
        </button>
      </div>

      <div className="row g-2 g-md-3 g-lg-4 mb-3 mb-md-4">
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(255, 140, 0, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(255, 140, 0, 0.1)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
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
            <div className="card-body p-2 p-md-3 p-lg-4 position-relative">
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
                    <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1 text-dark" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.total}</h3>
              <p className="mb-0 text-muted fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Total Notifications</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(67, 233, 123, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(67, 233, 123, 0.1)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
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
            <div className="card-body p-2 p-md-3 p-lg-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-2 mb-md-3">
                <div
                  style={{
                    width: 'clamp(36px, 9vw, 48px)',
                    height: 'clamp(36px, 9vw, 48px)',
                    borderRadius: 'clamp(8px, 2vw, 12px)',
                    background: 'rgba(67, 233, 123, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="clamp(18px, 4.5vw, 24px)" height="clamp(18px, 4.5vw, 24px)" fill="#43e97b" viewBox="0 0 16 16">
                    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1 text-dark" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.sent}</h3>
              <p className="mb-0 text-muted fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Sent</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(255, 140, 0, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(255, 140, 0, 0.1)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
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
            <div className="card-body p-2 p-md-3 p-lg-4 position-relative">
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
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1 text-dark" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.scheduled}</h3>
              <p className="mb-0 text-muted fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Scheduled</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0, 102, 204, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 102, 204, 0.1)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
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
            <div className="card-body p-2 p-md-3 p-lg-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-2 mb-md-3">
                <div
                  style={{
                    width: 'clamp(36px, 9vw, 48px)',
                    height: 'clamp(36px, 9vw, 48px)',
                    borderRadius: 'clamp(8px, 2vw, 12px)',
                    background: 'rgba(0, 102, 204, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="clamp(18px, 4.5vw, 24px)" height="clamp(18px, 4.5vw, 24px)" fill="#0066cc" viewBox="0 0 16 16">
                    <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1 text-dark" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.adminCreated}</h3>
              <p className="mb-0 text-muted fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Admin Created</p>
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
              border: '1px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(255, 193, 7, 0.1)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 193, 7, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 193, 7, 0.1)';
            }}
          >
            <div className="card-body p-2 p-md-3 p-lg-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-2 mb-md-3">
                <div
                  style={{
                    width: 'clamp(36px, 9vw, 48px)',
                    height: 'clamp(36px, 9vw, 48px)',
                    borderRadius: 'clamp(8px, 2vw, 12px)',
                    background: 'rgba(255, 193, 7, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="clamp(18px, 4.5vw, 24px)" height="clamp(18px, 4.5vw, 24px)" fill="#ffc107" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1 text-dark" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.processing}</h3>
              <p className="mb-0 text-muted fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Processing</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(220, 53, 69, 0.1)',
              transition: 'all 0.3s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(220, 53, 69, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(220, 53, 69, 0.1)';
            }}
          >
            <div className="card-body p-2 p-md-3 p-lg-4 position-relative">
              <div className="d-flex justify-content-between align-items-start mb-2 mb-md-3">
                <div
                  style={{
                    width: 'clamp(36px, 9vw, 48px)',
                    height: 'clamp(36px, 9vw, 48px)',
                    borderRadius: 'clamp(8px, 2vw, 12px)',
                    background: 'rgba(220, 53, 69, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="clamp(18px, 4.5vw, 24px)" height="clamp(18px, 4.5vw, 24px)" fill="#dc3545" viewBox="0 0 16 16">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                  </svg>
                </div>
              </div>
              <h3 className="fw-bold mb-1 text-dark" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.failed}</h3>
              <p className="mb-0 text-muted fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Failed</p>
            </div>
          </div>
        </div>
      </div>

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
                  <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                  <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                </svg>
              </div>
              <div>
                <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>Notification List</h5>
                <small className="text-muted d-none d-md-inline">{filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'} found</small>
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
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}
                />
              </div>
              <div className="btn-group shadow-sm" role="group">
                <button
                  type="button"
                  className={`btn ${filterType === 'all' ? '' : 'btn-outline-'}primary`}
                  style={{
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    padding: '0.5rem 1rem',
                    borderColor: filterType === 'all' ? 'transparent' : 'var(--primary)',
                    background: filterType === 'all' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'white',
                    color: filterType === 'all' ? 'white' : 'var(--primary)',
                    fontWeight: '600'
                  }}
                  onClick={() => setFilterType('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn ${filterType === 'new_user' ? '' : 'btn-outline-'}primary`}
                  style={{
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    padding: '0.5rem 1rem',
                    borderColor: filterType === 'new_user' ? 'transparent' : 'var(--primary)',
                    background: filterType === 'new_user' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'white',
                    color: filterType === 'new_user' ? 'white' : 'var(--primary)',
                    fontWeight: '600'
                  }}
                  onClick={() => setFilterType('new_user')}
                >
                  Users
                </button>
                <button
                  type="button"
                  className={`btn ${filterType === 'payment' ? '' : 'btn-outline-'}primary`}
                  style={{
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    padding: '0.5rem 1rem',
                    borderColor: filterType === 'payment' ? 'transparent' : 'var(--primary)',
                    background: filterType === 'payment' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'white',
                    color: filterType === 'payment' ? 'white' : 'var(--primary)',
                    fontWeight: '600'
                  }}
                  onClick={() => setFilterType('payment')}
                >
                  Payments
                </button>
                <button
                  type="button"
                  className={`btn ${filterType === 'admin' ? '' : 'btn-outline-'}primary`}
                  style={{
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    padding: '0.5rem 1rem',
                    borderColor: filterType === 'admin' ? 'transparent' : 'var(--primary)',
                    background: filterType === 'admin' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'white',
                    color: filterType === 'admin' ? 'white' : 'var(--primary)',
                    fontWeight: '600'
                  }}
                  onClick={() => setFilterType('admin')}
                >
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {filteredNotifications.length > 0 ? (
            <div className="d-flex flex-column">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border-bottom p-3 p-md-4"
                  style={{
                    transition: 'all 0.3s ease',
                    borderBottom: '1px solid rgba(0,0,0,0.05)'
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
                  <div className="d-flex align-items-start">
                    <div
                      className="d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                      style={{
                        width: 'clamp(44px, 11vw, 56px)',
                        height: 'clamp(44px, 11vw, 56px)',
                        borderRadius: '12px',
                        background: notification.type === 'new_user' 
                          ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)'
                          : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                        boxShadow: notification.type === 'new_user'
                          ? '0 4px 15px rgba(255, 140, 0, 0.3)'
                          : '0 4px 15px rgba(67, 233, 123, 0.3)'
                      }}
                    >
                      {notification.type === 'new_user' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="clamp(22px, 5.5vw, 28px)" height="clamp(22px, 5.5vw, 28px)" fill="white" viewBox="0 0 16 16">
                          <path d="M7 14s-1 0-1-1 1-4 5-4 5 3 5 4-1 1-1 1H7Zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-5.784 6A2.238 2.238 0 0 1 5 13c0-1.355.68-2.75 1.936-3.72A6.325 6.325 0 0 0 5 9c-4 0-5 3-5 4s1 1 1 1h4.216ZM4.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="clamp(22px, 5.5vw, 28px)" height="clamp(22px, 5.5vw, 28px)" fill="white" viewBox="0 0 16 16">
                          <path d="M4 10.781c.148 1.667 1.857 3.219 4.219 3.219 1.472 0 2.828-.655 3.735-1.48-.653-1.154-1.622-2.03-2.735-2.53-.57-.25-1.17-.471-1.818-.708v2.194c-.376.197-.804.293-1.184.293a2.22 2.22 0 0 1-1.218-.5v-1.351c0-.98-.486-1.855-1.218-2.358a3.15 3.15 0 0 0-1.085-.54l-.52-.103a2.144 2.144 0 0 0-.434-.041 3.734 3.734 0 0 1 .23-1.841c.229-.558.56-1.007.992-1.346.434-.34-.903-.272-1.926-.272l-.84.008c-1.194.047-2.466.18-3.23.958C.956 4.766-.499 6.888.891 8.962c.232.434.533.853.95 1.222l.257.229c1.041.924 1.772 1.757 2.693 2.654 1.193.955 3.23 1.882 4.859.996.54-.294 1.018-.66 1.469-1.043l.146-.125c.585-.48 1.292-.99 1.846-1.384.277-.197.583-.4.767-.545Z"/>
                        </svg>
                      )}
                    </div>
                    <div className="flex-grow-1 min-w-0">
                      <div className="d-flex align-items-start justify-content-between mb-2 gap-3">
                        <div className="flex-grow-1 min-w-0">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <h6 className="fw-bold mb-0" style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)' }}>{notification.title}</h6>
                            {notification.image && (
                              <div 
                                className="flex-shrink-0"
                                style={{
                                  padding: '3px',
                                  background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 50%, #0066cc 100%)',
                                  borderRadius: '10px',
                                  boxShadow: '0 2px 8px rgba(255, 140, 0, 0.25)',
                                  transition: 'all 0.3s ease',
                                  display: 'inline-block'
                                }}
                                onMouseEnter={(e) => {
                                  if (window.innerWidth > 768) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 0, 0.4)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 140, 0, 0.25)';
                                }}
                              >
                                <div
                                  style={{
                                    width: 'clamp(50px, 12vw, 70px)',
                                    height: 'clamp(40px, 10vw, 55px)',
                                    borderRadius: '7px',
                                    overflow: 'hidden',
                                    background: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Image
                                    src={notification.image}
                                    alt="Notification"
                                    height={55}
                                    width={50}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => window.open(notification.image, '_blank')}
                                    onMouseEnter={(e) => {
                                      if (window.innerWidth > 768) {
                                        e.currentTarget.style.transform = 'scale(1.1)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.transform = 'scale(1)';
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>{notification.message}</p>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                          {notification.createdByAdmin && (
                            <span
                              className="badge"
                              style={{
                                fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                                color: 'white',
                                boxShadow: '0 2px 8px rgba(255, 140, 0, 0.3)'
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                              </svg>
                              Admin
                            </span>
                          )}
                          {notification.createdByAdmin && notification.status && (
                            <span
                              className={`badge ${
                                notification.status === 'sent' 
                                  ? 'bg-success' 
                                  : notification.status === 'failed'
                                  ? 'bg-danger'
                                  : notification.status === 'processing'
                                  ? 'bg-warning'
                                  : 'bg-info'
                              }`}
                              style={{
                                fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              {notification.status === 'processing' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                                </svg>
                              )}
                              {notification.status === 'sent' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                                </svg>
                              )}
                              {notification.status === 'failed' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
                                </svg>
                              )}
                              {notification.status === 'sent' ? 'Sent' : notification.status === 'failed' ? 'Failed' : notification.status === 'processing' ? 'Processing' : 'Scheduled'}
                            </span>
                          )}
                          {notification.createdByAdmin && notification.scheduled && !notification.status && (
                            <span
                              className="badge bg-info"
                              style={{
                                fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                                <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                              </svg>
                              Scheduled
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="d-flex flex-wrap align-items-center gap-3">
                        <div className="d-flex align-items-center">
                          <div
                            className="d-flex align-items-center justify-content-center me-2"
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: getAvatarColor(notification.user.name),
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '0.8rem',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                          >
                            {getInitials(notification.user.name)}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.9rem)' }}>{notification.user.name}</div>
                            <small className="text-muted d-none d-md-block" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>{notification.user.email}</small>
                          </div>
                        </div>
                        <div className="d-flex align-items-center text-muted">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                          </svg>
                          <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{formatTimestamp(notification.timestamp)}</span>
                        </div>
                        <div className="d-none d-md-flex align-items-center">
                          <span
                            className={`badge ${
                              notification.user.plan === 'Premium'
                                ? 'bg-danger'
                                : notification.user.plan === 'Pro'
                                ? 'bg-primary'
                                : notification.user.plan === 'All Plans'
                                ? 'bg-info'
                                : 'bg-secondary'
                            }`}
                            style={{
                              fontSize: '0.8rem',
                              padding: '0.35rem 0.7rem',
                              borderRadius: '6px',
                              fontWeight: '600'
                            }}
                          >
                            {notification.user.plan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="var(--light-gray)" viewBox="0 0 16 16" className="mb-3">
                <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
              </svg>
              <h5 className="text-muted mb-2">No notifications found</h5>
              <p className="text-muted small mb-0">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1050,
            padding: '1rem'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="card border-0"
            style={{
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="card-header text-white border-0"
              style={{
                background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                borderRadius: '16px 16px 0 0',
                padding: '1.5rem'
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div
                    className="d-flex align-items-center justify-content-center me-3"
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16">
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                  </div>
                  <div>
                    <h5 className="mb-0 fw-bold">Create Notification</h5>
                    <small className="opacity-90">Send notification immediately or schedule for later</small>
                  </div>
                </div>
                <button
                  className="btn btn-link text-white p-0"
                  style={{ textDecoration: 'none' }}
                  onClick={() => setShowCreateModal(false)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleCreateNotification}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Notification Type</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., New User Registration, Payment Alert, System Update"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  />
                  <small className="text-muted">Enter the type of notification</small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Recipient</label>
                  <select
                    className="form-select"
                    value={formData.recipient}
                    onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                    required
                  >
                    <option value="all">All Users</option>
                    <option value="premium">Premium Users Only</option>
                    <option value="pro">Pro Users Only</option>
                    <option value="basic">Basic Users Only</option>
                    <option value="specific">Specific User</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter notification title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Message</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Enter notification message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold d-block text-center">Image (Optional)</label>
                  <div className="border rounded p-4 d-flex align-items-center justify-content-center" style={{ 
                    borderStyle: 'dashed',
                    borderColor: formData.imagePreview ? 'var(--primary)' : '#dee2e6',
                    backgroundColor: formData.imagePreview ? 'rgba(255, 140, 0, 0.05)' : '#f8f9fa',
                    transition: 'all 0.3s ease',
                    minHeight: '200px'
                  }}>
                    {formData.imagePreview ? (
                      <div className="text-center w-100">

                        <img
                          src={formData.imagePreview}
                          alt="Preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '12px',
                            marginBottom: '1rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            objectFit: 'contain'
                          }}
                        />
                        <div className="d-flex gap-2 justify-content-center">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setFormData({ ...formData, image: null, imagePreview: null })}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                              <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                            </svg>
                            Remove
                          </button>
                          <label className="btn btn-sm btn-outline-primary mb-0" style={{ cursor: 'pointer' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                            </svg>
                            Change Image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              style={{ display: 'none' }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label style={{ cursor: 'pointer', width: '100%' }}>
                        <div className="text-center py-4 d-flex flex-column align-items-center justify-content-center">
                          <div
                            className="d-inline-flex align-items-center justify-content-center mb-3"
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                              boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 16 16">
                              <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                              <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                            </svg>
                          </div>
                          <h6 className="fw-semibold mb-2" style={{ color: 'var(--accent)' }}>Upload Image</h6>
                          <p className="text-muted small mb-2">Click to browse or drag and drop</p>
                          <p className="text-muted" style={{ fontSize: '0.75rem' }}>PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Send Type</label>
                  <div className="btn-group w-100" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="scheduleType"
                      id="immediate"
                      value="immediate"
                      checked={formData.scheduleType === 'immediate'}
                      onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                    />
                    <label
                      className="btn"
                      htmlFor="immediate"
                      style={{
                        background: formData.scheduleType === 'immediate' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'white',
                        color: formData.scheduleType === 'immediate' ? 'white' : 'var(--primary)',
                        border: formData.scheduleType === 'immediate' ? 'none' : '1px solid var(--primary)',
                        fontWeight: '600'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                      </svg>
                      Send Immediately
                    </label>
                    <input
                      type="radio"
                      className="btn-check"
                      name="scheduleType"
                      id="scheduled"
                      value="scheduled"
                      checked={formData.scheduleType === 'scheduled'}
                      onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                    />
                    <label
                      className="btn"
                      htmlFor="scheduled"
                      style={{
                        background: formData.scheduleType === 'scheduled' ? 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)' : 'white',
                        color: formData.scheduleType === 'scheduled' ? 'white' : 'var(--primary)',
                        border: formData.scheduleType === 'scheduled' ? 'none' : '1px solid var(--primary)',
                        fontWeight: '600'
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                      </svg>
                      Schedule
                    </label>
                  </div>
                </div>

                {formData.scheduleType === 'scheduled' && (
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        required={formData.scheduleType === 'scheduled'}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={formData.scheduledTime}
                        onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                        required={formData.scheduleType === 'scheduled'}
                      />
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary flex-fill"
                    onClick={() => setShowCreateModal(false)}
                    style={{ borderRadius: '10px', fontWeight: '600' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn flex-fill text-white"
                    style={{
                      background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: '600',
                      boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)'
                    }}
                  >
                    {formData.scheduleType === 'immediate' ? 'Send Now' : 'Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}

