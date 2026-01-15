'use client';

import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';

export default function DocumentationPage() {
  const docs = [
    {
      category: 'Getting Started',
      items: [
        { title: 'Introduction to AlgoBot', icon: 'book' },
        { title: 'Quick Start Guide', icon: 'rocket-takeoff' },
        { title: 'Account Setup', icon: 'person-check' }
      ]
    },
    {
      category: 'API Reference',
      items: [
        { title: 'Authentication', icon: 'key' },
        { title: 'Trading Endpoints', icon: 'graph-up-arrow' },
        { title: 'Webhooks', icon: 'link-45deg' }
      ]
    },
    {
      category: 'Guides',
      items: [
        { title: 'Strategy Configuration', icon: 'sliders' },
        { title: 'Risk Management', icon: 'shield-check' },
        { title: 'Performance Optimization', icon: 'speedometer2' }
      ]
    },
    {
      category: 'Troubleshooting',
      items: [
        { title: 'Common Issues', icon: 'exclamation-triangle' },
        { title: 'Error Codes', icon: 'bug' },
        { title: 'FAQs', icon: 'question-circle' }
      ]
    }
  ];

  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              AlgoBot <span className="primary">Documentation</span>
            </h1>
            <p className="lead text-muted">
              Comprehensive documentation to help you get the most out of AlgoBot.
            </p>
          </div>

          <div className="row g-4 mb-5">
            {docs.map((section, index) => (
              <div key={index} className="col-12 col-md-6">
                <div className="card border-0 shadow-card h-100">
                  <div className="card-body p-4">
                    <h4 className="fw-bold mb-4 primary">{section.category}</h4>
                    <ul className="list-unstyled">
                      {section.items.map((item, idx) => (
                        <li key={idx} className="mb-3">
                          <a href="#" className="text-decoration-none text-dark d-flex align-items-center">
                            <BootstrapIcon name={item.icon} className="me-3 text-primary" />
                            <span>{item.title}</span>
                            <BootstrapIcon name="chevron-right" className="ms-auto text-muted" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row">
            <div className="col-12 col-md-6 mb-4 mb-md-0">
              <div className="card border-0 shadow-card p-4 h-100">
                <BootstrapIcon name="download" className="fs-1 text-primary mb-3" />
                <h5 className="fw-bold mb-3">Download PDF Guides</h5>
                <p className="text-muted mb-3">
                  Download comprehensive PDF guides for offline reference.
                </p>
                <a href="#" className="btn btn-outline-primary">Download</a>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="card border-0 shadow-card p-4 h-100">
                <BootstrapIcon name="chat-dots" className="fs-1 text-primary mb-3" />
                <h5 className="fw-bold mb-3">Need Help?</h5>
                <p className="text-muted mb-3">
                  Can't find what you're looking for? Our support team is here to help.
                </p>
                <a href="/home/contact" className="btn btn-outline-primary">Contact Support</a>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
