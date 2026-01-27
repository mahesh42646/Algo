'use client';

import React, { useState } from 'react';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';

function Avatar({ user, name }) {
  return (
    <span
      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center flex-shrink-0"
      style={{
        width: 44,
        height: 44,
        fontWeight: 600,
        fontSize: '1.1rem',
        border: '2px solid #fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textTransform: 'uppercase',
      }}
      aria-label={name}
    >
      {user}
    </span>
  );
}

function LatestPostModal({ post, visible, onClose }) {
  if (!visible || !post) return null;
  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-card">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-semibold">
              <BootstrapIcon name="chat-left-text" className="me-2 text-primary" />
              Latest Topic: {post.title}
            </h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="d-flex align-items-center mb-3">
              <Avatar user={post.user} name={post.name} />
              <div className="ms-3">
                <div className="fw-semibold">{post.name}</div>
                <div className="text-muted small">Posted on {post.date}</div>
              </div>
            </div>
            <div className="mb-3">
              <strong>Title:</strong>
              <div>{post.title}</div>
            </div>
            <div className="d-flex align-items-center gap-3 mb-2">
              <span className="badge bg-secondary">
                <BootstrapIcon name="chat-left-text" className="me-1" />
                {post.replies} {post.replies === 1 ? 'Reply' : 'Replies'}
              </span>
              <span className="badge bg-info text-dark">
                <BootstrapIcon name="clock" className="me-1" />
                {post.date}
              </span>
            </div>
            <div className="alert alert-info mt-4 mb-0">
              <BootstrapIcon name="info-circle" className="me-2" />
              <span>
                For security reasons, full post details are available after you join and log in. 
                <a href="/auth/registration" className="ms-2 text-decoration-underline fw-semibold">Sign Up</a> or <a href="/auth/login" className="ms-1 text-decoration-underline fw-semibold">Sign In</a> to read and reply!
              </span>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const categories = [
    {
      name: 'Support',
      description:
        'This forum is for AlgoBot beginners. If you are new and have a question, this is the best place to ask.',
      topics: 7,
      color: 'primary',
      icon: 'question-circle',
      latest: {
        title: 'Welcome to AlgoBot Community!',
        user: 'N',
        name: 'Nina',
        replies: 1,
        date: 'Jun 25',
      },
      points: [
        'Get started with AlgoBot.',
        'Read onboarding guides.',
        'Ask your first question.'
      ]
    },
    {
      name: 'Uncategorized',
      description:
        "Topics that don't need a category, or don't fit into any other existing category.",
      topics: 27,
      color: 'warning',
      icon: 'three-dots',
      latest: {
        title: 'Account Recovery Issue',
        user: 'I',
        name: 'Ivan',
        replies: 0,
        date: '30d',
      },
      points: [
        'General discussions.',
        'Feedback and suggestions.',
        'Open topics for any subject.'
      ]
    },
    {
      name: 'AlgoBot FAQ',
      description:
        'Common questions about AlgoBot app, trading, and team building.',
      topics: 34,
      color: 'info',
      icon: 'journal-bookmark',
      latest: {
        title: 'How to transfer funds',
        user: 'V',
        name: 'Vera',
        replies: 0,
        date: 'Oct 25',
      },
      points: [
        'Common trading questions.',
        'Tips & tricks.',
        'Guides for advanced users.'
      ]
    },
    {
      name: 'Feature Requests',
      description:
        'Suggest new features or improvements for AlgoBot. Vote for ideas!',
      topics: 19,
      color: 'success',
      icon: 'star',
      latest: {
        title: 'Add Binance Futures support',
        user: 'M',
        name: 'Mark',
        replies: 2,
        date: '3d',
      },
      points: [
        'Request new features.',
        'Vote on other suggestions.',
        'Share your use cases.'
      ]
    }
  ];

  // Manage which post to show in modal
  const [modalPost, setModalPost] = useState(null);

  const handleViewClick = (post) => {
    setModalPost(post);
  };

  const handleModalClose = () => {
    setModalPost(null);
  };

  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-4 py-md-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          
          {/* Header Banner */}
          <section className="mb-5">
            <div className="row align-items-center g-4 mb-4">
              <div className="col-12 col-md-8">
                <h1 className="display-5 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
                  AlgoBot <span className="primary">Community</span>
                </h1>
                <p className="lead text-muted mb-0">
                  Connect with fellow traders, get support & share knowledge.<br className="d-none d-md-block" />
                  <span className="d-inline d-md-block">AlgoBot Community is for everyone!</span>
                </p>
              </div>
              <div className="col-12 col-md-4 d-none d-md-flex justify-content-end align-items-center">
                <div className="bg-primary bg-opacity-10 rounded-circle p-4">
                  <BootstrapIcon name="chat-dots" className="fs-1 text-primary" />
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="d-flex align-items-center gap-2 gap-md-3 flex-wrap">
              <button className="btn btn-light border fw-semibold">
                <BootstrapIcon name="list-ul" className="me-2" />
                <span className="d-none d-sm-inline">All Categories</span>
                <span className="d-inline d-sm-none">Categories</span>
              </button>
              <button className="btn btn-light border fw-semibold">
                <BootstrapIcon name="tags" className="me-2" />
                <span className="d-none d-sm-inline">All Tags</span>
                <span className="d-inline d-sm-none">Tags</span>
              </button>
              <button className="btn btn-outline-primary fw-semibold d-none d-md-inline-flex">
                <BootstrapIcon name="star" className="me-1" />
                Top
              </button>
              <button className="btn btn-primary fw-semibold">
                <BootstrapIcon name="clock-history" className="me-1" />
                Latest
              </button>
              <div className="ms-auto">
                <button className="btn btn-success px-3 px-md-4 fw-semibold">
                  <BootstrapIcon name="plus-circle" className="me-2" />
                  <span className="d-none d-sm-inline">New Topic</span>
                  <span className="d-inline d-sm-none">New</span>
                </button>
              </div>
            </div>
          </section>

          {/* Categories Grid */}
          <section>
            <div className="row g-4">
              {categories.map((cat, index) => (
                <div key={index} className="col-12 col-lg-6">
                  <div className="card border-0 shadow-card h-100 community-category-card">
                    <div className="card-body p-4">
                      {/* Category Header */}
                      <div className="d-flex align-items-start gap-3 mb-3">
                        <div className={`bg-${cat.color} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: 56, height: 56 }}>
                          <BootstrapIcon name={cat.icon} className={`fs-3 text-${cat.color}`} />
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <h4 className="fw-bold mb-0" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.3rem)' }}>{cat.name}</h4>
                            <span className="badge bg-secondary bg-opacity-10 text-dark px-3 py-2">
                              {cat.topics} Topics
                            </span>
                          </div>
                          <p className="text-muted small mb-0">{cat.description}</p>
                        </div>
                      </div>

                      {/* Key Points */}
                      <div className="mb-4">
                        <ul className="list-unstyled mb-0">
                          {cat.points && cat.points.map((point, idx) => (
                            <li key={idx} className="mb-2 d-flex align-items-start">
                              <BootstrapIcon name="check-circle-fill" className={`text-${cat.color} me-2 mt-1 flex-shrink-0`} style={{ fontSize: '0.875rem' }} />
                              <span className="small text-muted">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Latest Post */}
                      <div className="border-top pt-3">
                        <div className="d-flex align-items-start gap-3">
                          <Avatar user={cat.latest.user} name={cat.latest.name} />
                          <div className="flex-grow-1">
                            <div className="fw-semibold mb-2" style={{ fontSize: '0.95rem' }}>
                              <a href="#" className="text-dark text-decoration-none" tabIndex={-1}>
                                {cat.latest.title}
                              </a>
                            </div>
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              <span className="text-muted small d-flex align-items-center">
                                <BootstrapIcon name="chat-left-text" className="me-1" style={{ fontSize: '0.75rem' }} />
                                {cat.latest.replies} {cat.latest.replies === 1 ? 'Reply' : 'Replies'}
                              </span>
                              <span className="text-muted small d-flex align-items-center">
                                <BootstrapIcon name="clock" className="me-1" style={{ fontSize: '0.75rem' }} />
                                {cat.latest.date}
                              </span>
                              <button
                                type="button"
                                className="ms-auto btn btn-link text-primary text-decoration-none small fw-semibold px-0"
                                style={{ boxShadow: "none" }}
                                onClick={() => handleViewClick(cat.latest)}
                                aria-label={`View details about ${cat.latest.title}`}
                              >
                                View <BootstrapIcon name="arrow-right" style={{ fontSize: '0.75rem' }} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Show LatestPostModal after view button click */}
          <LatestPostModal post={modalPost} visible={!!modalPost} onClose={handleModalClose} />

          {/* Join Community CTA */}
          <section className="mt-5">
            <div className="card border-0 shadow-card" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)' }}>
              <div className="card-body p-4 p-md-5 text-center text-white">
                <BootstrapIcon name="people-fill" className="fs-1 mb-3" />
                <h3 className="fw-bold mb-3">Join the Conversation</h3>
                <p className="mb-4 opacity-90">
                  Be part of a growing community of traders sharing insights, strategies, and helping each other succeed.
                </p>
                <div className="d-flex gap-3 justify-content-center flex-wrap">
                  <a href="/auth/registration" className="btn btn-light btn-lg px-4 fw-semibold ">
                    <BootstrapIcon name="person-plus" className="me-2" />
                    Sign Up
                  </a>
                  <a href="/auth/login" className="btn btn-outline-light btn-lg px-4 fw-semibold ">
                    <BootstrapIcon name="box-arrow-in-right" className="me-2" />
                    Sign In
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
      <Footer />

      <style jsx>{`
        .community-category-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .community-category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
        }
        .community-category-card .card-body {
          transition: background-color 0.2s ease;
        }
        .community-category-card:hover .card-body {
          background-color: #fafbfc;
        }
        .modal.fade {
          pointer-events: auto;
        }
        .modal-backdrop {
          display: none;
        }
      `}</style>
    </>
  );
}
