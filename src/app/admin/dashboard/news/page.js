'use client';

import { useState, useMemo, useEffect } from 'react';

export default function News() {
  const [news, setNews] = useState([
    {
      id: 1,
      title: 'New Feature Launch: Advanced Analytics Dashboard',
      description: 'We are excited to announce the launch of our new advanced analytics dashboard. This feature provides comprehensive insights into your business metrics, user behavior, and performance indicators. The dashboard includes real-time data visualization, customizable reports, and export capabilities.',
      content: 'We are excited to announce the launch of our new advanced analytics dashboard. This feature provides comprehensive insights into your business metrics, user behavior, and performance indicators. The dashboard includes real-time data visualization, customizable reports, and export capabilities. With this update, you can now track your KPIs more effectively and make data-driven decisions with confidence.',
      category: 'Product Updates',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
      author: 'Admin',
      status: 'Published',
      publishDate: '2024-01-20',
      views: 1250,
      createdAt: '2024-01-20 10:00:00'
    },
    {
      id: 2,
      title: 'Security Enhancement: Two-Factor Authentication',
      description: 'We have implemented enhanced security measures including mandatory two-factor authentication for all premium accounts. This ensures better protection of your data and accounts.',
      content: 'We have implemented enhanced security measures including mandatory two-factor authentication for all premium accounts. This ensures better protection of your data and accounts. The new security features include SMS and email verification, authenticator app support, and backup codes for account recovery.',
      category: 'Security',
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=400&fit=crop',
      author: 'Admin',
      status: 'Published',
      publishDate: '2024-01-18',
      views: 890,
      createdAt: '2024-01-18 14:30:00'
    },
    {
      id: 3,
      title: 'Monthly Newsletter: January Highlights',
      description: 'Check out our monthly newsletter featuring the latest updates, user stories, and upcoming features. This month we highlight our community achievements and roadmap for Q1 2024.',
      content: 'Check out our monthly newsletter featuring the latest updates, user stories, and upcoming features. This month we highlight our community achievements and roadmap for Q1 2024. We are grateful for your continued support and feedback.',
      category: 'Announcements',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
      author: 'Admin',
      status: 'Draft',
      publishDate: '2024-01-22',
      views: 0,
      createdAt: '2024-01-19 09:15:00'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'Announcements',
    image: '',
    publishDate: new Date().toISOString().split('T')[0],
    status: 'Draft'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [imagePreview, setImagePreview] = useState(null);

  const categories = ['Announcements', 'Product Updates', 'Security', 'Events', 'General'];

  const filteredNews = useMemo(() => {
    let filtered = news;

    if (filterCategory !== 'all') {
      filtered = filtered.filter(n => n.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(n => n.status === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(term) ||
        n.description.toLowerCase().includes(term) ||
        n.category.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [news, filterCategory, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: news.length,
      published: news.filter(n => n.status === 'Published').length,
      drafts: news.filter(n => n.status === 'Draft').length,
      totalViews: news.reduce((sum, n) => sum + n.views, 0)
    };
  }, [news]);

  const handleOpenModal = (newsItem = null) => {
    if (newsItem) {
      setEditingNews(newsItem);
      setFormData({
        title: newsItem.title,
        description: newsItem.description,
        content: newsItem.content,
        category: newsItem.category,
        image: newsItem.image,
        publishDate: newsItem.publishDate,
        status: newsItem.status
      });
      setImagePreview(newsItem.image);
    } else {
      setEditingNews(null);
      setFormData({
        title: '',
        description: '',
        content: '',
        category: 'Announcements',
        image: '',
        publishDate: new Date().toISOString().split('T')[0],
        status: 'Draft'
      });
      setImagePreview(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNews(null);
    setFormData({
      title: '',
      description: '',
      content: '',
      category: 'Announcements',
      image: '',
      publishDate: new Date().toISOString().split('T')[0],
      status: 'Draft'
    });
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingNews) {
      setNews(prev => prev.map(n =>
        n.id === editingNews.id
          ? {
              ...n,
              ...formData,
              updatedAt: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
            }
          : n
      ));
    } else {
      const newNews = {
        id: Date.now(),
        ...formData,
        author: 'Admin',
        views: 0,
        createdAt: new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setNews(prev => [newNews, ...prev]);
    }

    handleCloseModal();
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this news item?')) {
      setNews(prev => prev.filter(n => n.id !== id));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showModal) {
        setShowModal(false);
        setEditingNews(null);
        setFormData({
          title: '',
          description: '',
          content: '',
          category: 'Announcements',
          image: '',
          publishDate: new Date().toISOString().split('T')[0],
          status: 'Draft'
        });
        setImagePreview(null);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showModal]);

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
                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
              </svg>
            </div>
            <div>
              <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>News Management</h2>
              <p className="text-muted mb-0 small d-none d-md-block">Create and manage news articles</p>
            </div>
          </div>
        </div>
        <button
          className="btn d-flex align-items-center"
          onClick={() => handleOpenModal()}
          style={{
            background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            padding: '0.6rem 1.5rem',
            fontWeight: '600',
            fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
            boxShadow: '0 4px 15px rgba(255, 140, 0, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 140, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 140, 0, 0.3)';
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="me-2">
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Create News
        </button>
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
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2', color: '#1a202c' }}>{stats.total}</h3>
              <p className="mb-0 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)', color: '#718096' }}>Total News</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card h-100"
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid rgba(67, 233, 123, 0.3)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (window.innerWidth > 768) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(67, 233, 123, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(67, 233, 123, 0.3)';
            }}
          >
            <div className="card-body p-2 p-md-3 p-lg-4">
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2', color: '#1a202c' }}>{stats.published}</h3>
              <p className="mb-0 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)', color: '#718096' }}>Published</p>
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
              transition: 'all 0.3s ease'
            }}
          >
            <div className="card-body p-2 p-md-3 p-lg-4">
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.drafts}</h3>
              <p className="mb-0 opacity-90 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Drafts</p>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-6 col-lg-3">
          <div
            className="card border-0 text-white h-100"
            style={{
              background: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0, 102, 204, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            <div className="card-body p-2 p-md-3 p-lg-4">
              <h3 className="fw-bold mb-1" style={{ fontSize: 'clamp(1.1rem, 5vw, 2rem)', lineHeight: '1.2' }}>{stats.totalViews.toLocaleString()}</h3>
              <p className="mb-0 opacity-90 fw-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.95rem)' }}>Total Views</p>
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
              <h5 className="mb-0 fw-bold me-2" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.1rem)' }}>News List</h5>
              <small className="text-muted d-none d-md-inline">({filteredNews.length} {filteredNews.length === 1 ? 'article' : 'articles'})</small>
            </div>
            <div className="d-flex flex-column flex-md-row gap-2 w-100 w-md-auto">
              <div className="input-group shadow-sm" style={{ maxWidth: '100%' }}>
                <span className="input-group-text bg-white border-end-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--accent)" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search news..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}
                />
              </div>
              <div className="d-flex flex-wrap gap-2 shadow-sm">
                <select
                  className="form-select"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                    padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.7rem, 2vw, 1rem)',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                    padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.7rem, 2vw, 1rem)',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {filteredNews.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead style={{ background: 'linear-gradient(135deg, rgba(255, 140, 0, 0.1) 0%, rgba(0, 102, 204, 0.1) 100%)' }}>
                  <tr>
                    <th className="px-3 py-2 py-md-3 fw-bold d-none d-md-table-cell" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Image</th>
                    <th className="px-3 py-2 py-md-3 fw-bold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Title</th>
                    <th className="px-3 py-2 py-md-3 fw-bold d-none d-lg-table-cell" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Description</th>
                    <th className="px-3 py-2 py-md-3 fw-bold d-none d-md-table-cell" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Category</th>
                    <th className="px-3 py-2 py-md-3 fw-bold d-none d-xl-table-cell" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Publish Date</th>
                    <th className="px-3 py-2 py-md-3 fw-bold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Status</th>
                    <th className="px-3 py-2 py-md-3 fw-bold text-center" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)', color: 'var(--accent)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNews.map((item) => (
                    <tr
                      key={item.id}
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
                      <td className="px-3 py-2 py-md-3 d-none d-md-table-cell">
                        {item.image ? (
                          <div
                            style={{
                              width: '60px',
                              height: '40px',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              background: '#f8f9fa',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(item.image, '_blank')}
                          >
                            <img
                              src={item.image}
                              alt={item.title}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            style={{
                              width: '60px',
                              height: '40px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#adb5bd" viewBox="0 0 16 16">
                              <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                              <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 py-md-3">
                        <div className="fw-semibold" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.95rem)', color: '#212529' }}>{item.title}</div>
                        <small className="text-muted d-md-none d-block" style={{ fontSize: '0.75rem' }}>{item.description.substring(0, 50)}...</small>
                      </td>
                      <td className="px-3 py-2 py-md-3 d-none d-lg-table-cell">
                        <p className="mb-0 text-truncate" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', maxWidth: '300px', color: '#6c757d' }}>{item.description}</p>
                      </td>
                      <td className="px-3 py-2 py-md-3 d-none d-md-table-cell">
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(255, 140, 0, 0.1)',
                            color: '#ff8c00',
                            fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                            padding: '0.4rem 0.7rem',
                            borderRadius: '6px',
                            fontWeight: '600'
                          }}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 py-md-3 d-none d-xl-table-cell">
                        <span style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>{formatDate(item.publishDate)}</span>
                      </td>
                      <td className="px-3 py-2 py-md-3">
                        <span
                          className={`badge ${
                            item.status === 'Published'
                              ? 'bg-success'
                              : 'bg-warning'
                          }`}
                          style={{
                            fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                            padding: '0.4rem 0.7rem',
                            borderRadius: '6px',
                            fontWeight: '600'
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 py-md-3 text-center">
                        <div className="d-flex gap-1 gap-md-2 justify-content-center align-items-center" style={{ flexWrap: 'nowrap' }}>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleOpenModal(item)}
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
                              flexShrink: 0
                            }}
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10H.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.179z"/>
                            </svg>
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDelete(item.id)}
                            style={{
                              background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: 'clamp(0.3rem, 1.5vw, 0.4rem) clamp(0.4rem, 1.5vw, 0.6rem)',
                              fontWeight: '600',
                              fontSize: 'clamp(0.65rem, 1.8vw, 0.8rem)',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 2px 6px rgba(220, 53, 69, 0.3)',
                              flexShrink: 0
                            }}
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                              <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="var(--light-gray)" viewBox="0 0 16 16" className="mb-3">
                <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 2h-4v3h4V4zm0 4h-4v3h4V8zm0 4h-4v3h3a1 1 0 0 0 1-1v-2zm-5 3v-3H6v3h4zm-5 0v-3H1v2a1 1 0 0 0 1 1h3zm-4-4h4V8H1v3zm0-4h4V4H1v3zm5-3v3h4V4H6zm4 4H6v3h4V8z"/>
              </svg>
              <h5 className="text-muted mb-2">No news found</h5>
              <p className="text-muted small mb-0">Create your first news article to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit News Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            zIndex: 1050,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflowY: 'auto',
            padding: '1rem'
          }}
          onClick={handleCloseModal}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{
              maxWidth: '800px',
              width: '100%',
              margin: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content border-0"
              style={{
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                className="modal-header border-0 pb-0"
                style={{
                  background: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                  borderRadius: '16px 16px 0 0',
                  color: 'white'
                }}
              >
                <div className="w-100">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="modal-title fw-bold mb-1" style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
                        {editingNews ? 'Edit News' : 'Create New News'}
                      </h5>
                      <p className="mb-0 opacity-90" style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
                        {editingNews ? 'Update news article details' : 'Fill in the details to create a new news article'}
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
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div 
                  className="modal-body p-3 p-md-4"
                  style={{
                    overflowY: 'auto',
                    maxHeight: 'calc(90vh - 200px)',
                    flex: '1 1 auto'
                  }}
                >
                  <div className="mb-3">
                    <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                      Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter news title"
                      required
                      style={{
                        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                      Short Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter a brief description (will be shown in previews)"
                      rows="3"
                      required
                      style={{
                        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                      Full Content <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Enter the full news content"
                      rows="6"
                      required
                      style={{
                        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid #dee2e6',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                        Category
                      </label>
                      <select
                        className="form-select"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        style={{
                          fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                          padding: '0.6rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                        Publish Date
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.publishDate}
                        onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                        style={{
                          fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                          padding: '0.6rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-2 d-flex align-items-center" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                        Status
                        {formData.status === 'Published' && (
                          <span className="badge bg-success ms-2" style={{ fontSize: '0.7rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" className="me-1">
                              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                            </svg>
                            Live
                          </span>
                        )}
                      </label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        style={{
                          fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                          padding: '0.6rem 1rem',
                          borderRadius: '8px',
                          border: formData.status === 'Published' 
                            ? '2px solid #43e97b' 
                            : '1px solid #dee2e6',
                          background: formData.status === 'Published'
                            ? 'rgba(67, 233, 123, 0.05)'
                            : 'white',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold mb-2" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                        Image URL or Upload
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{
                          fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                          padding: '0.6rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}
                      />
                      <input
                        type="text"
                        className="form-control mt-2"
                        value={formData.image}
                        onChange={(e) => {
                          setFormData({ ...formData, image: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="Or enter image URL"
                        style={{
                          fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                          padding: '0.6rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}
                      />
                    </div>
                  </div>

                  {imagePreview && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold mb-2 d-flex align-items-center justify-content-between" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                        <span>Image Preview</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-0"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData({ ...formData, image: '' });
                            const fileInput = document.querySelector('input[type="file"]');
                            if (fileInput) fileInput.value = '';
                          }}
                          style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                        >
                          Remove
                        </button>
                      </label>
                      <div
                        style={{
                          width: '100%',
                          maxHeight: '300px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid rgba(255, 140, 0, 0.2)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          position: 'relative'
                        }}
                      >
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '300px',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const parent = e.target.parentElement;
                            parent.innerHTML = '<div class="text-center p-4"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#dc3545" viewBox="0 0 16 16" class="mb-2"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg><div class="text-danger fw-semibold">Invalid image URL</div><small class="text-muted d-block mt-1">Please check the URL or upload a valid image</small></div>';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div 
                  className="modal-footer border-0 pt-3 pb-3 pb-md-4 px-3 px-md-4 d-flex justify-content-between align-items-center"
                  style={{
                    flexShrink: 0,
                    borderTop: '1px solid rgba(0, 0, 0, 0.05)'
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    style={{
                      borderRadius: '8px',
                      padding: '0.6rem 1.5rem',
                      fontWeight: '600',
                      fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Cancel
                  </button>
                  <div className="d-flex gap-2">
                    {formData.status === 'Draft' && (
                      <button
                        type="button"
                        className="btn"
                        onClick={(e) => {
                          e.preventDefault();
                          setFormData({ ...formData, status: 'Published' });
                          setTimeout(() => {
                            const form = e.target.closest('form');
                            if (form) {
                              form.requestSubmit();
                            }
                          }, 100);
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.6rem 1.5rem',
                          fontWeight: '600',
                          fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                          boxShadow: '0 4px 15px rgba(67, 233, 123, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(67, 233, 123, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(67, 233, 123, 0.3)';
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                          <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                        </svg>
                        Publish
                      </button>
                    )}
                    <button
                      type="submit"
                      className="btn"
                      style={{
                        background: formData.status === 'Published' 
                          ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
                          : 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.6rem 1.5rem',
                        fontWeight: '600',
                        fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                        boxShadow: formData.status === 'Published'
                          ? '0 4px 15px rgba(67, 233, 123, 0.3)'
                          : '0 4px 15px rgba(255, 140, 0, 0.3)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = formData.status === 'Published'
                          ? '0 6px 20px rgba(67, 233, 123, 0.4)'
                          : '0 6px 20px rgba(255, 140, 0, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = formData.status === 'Published'
                          ? '0 4px 15px rgba(67, 233, 123, 0.3)'
                          : '0 4px 15px rgba(255, 140, 0, 0.3)';
                      }}
                    >
                      {editingNews ? 'Update News' : formData.status === 'Published' ? 'Publish Now' : 'Save as Draft'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

