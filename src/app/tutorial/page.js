'use client';

import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';
import Image from 'next/image';

export default function TutorialPage() {
  const tutorials = [
    {
      title: 'Getting Started with AlgoBot',
      description: 'Learn the basics of setting up your AlgoBot account and connecting your first exchange.',
      icon: 'play-circle',
      duration: '10 min',
      level: 'Beginner'
    },
    {
      title: 'Connecting Your Exchange',
      description: 'Step-by-step guide to securely connect Binance, Coinbase, or other supported exchanges.',
      icon: 'link-45deg',
      duration: '15 min',
      level: 'Beginner'
    },
    {
      title: 'Setting Up Trading Strategies',
      description: 'Configure your trading parameters, risk management, and automated strategies.',
      icon: 'gear',
      duration: '20 min',
      level: 'Intermediate'
    },
    {
      title: 'Understanding Analytics',
      description: 'Learn how to read your trading analytics and optimize your performance.',
      icon: 'graph-up',
      duration: '25 min',
      level: 'Intermediate'
    },
    {
      title: 'Advanced Strategy Customization',
      description: 'Create custom trading strategies and fine-tune advanced parameters.',
      icon: 'sliders',
      duration: '30 min',
      level: 'Advanced'
    },
    {
      title: 'Risk Management Best Practices',
      description: 'Master risk management techniques to protect your capital while maximizing returns.',
      icon: 'shield-check',
      duration: '20 min',
      level: 'Intermediate'
    }
  ];

  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              AlgoBot <span className="primary">Tutorials</span>
            </h1>
            <p className="lead text-muted">
              Learn how to maximize your trading potential with our comprehensive tutorials and guides.
            </p>
          </div>

          <div className="row g-4">
            {tutorials.map((tutorial, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-4">
                <div className="card h-100 border-0 shadow-card glass-card algo-card-hover">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 me-3"
                        style={{ width: 56, height: 56 }}
                      >
                        <BootstrapIcon name={tutorial.icon} className="text-primary" style={{ fontSize: '2rem', lineHeight: 1 }} />
                      </div>
                      <div>
                        <span className="badge bg-secondary">{tutorial.level}</span>
                        <span className="badge bg-info ms-1">{tutorial.duration}</span>
                      </div>
                    </div>
                    <h5 className="fw-bold mb-3">{tutorial.title}</h5>
                    <p className="text-muted mb-3">{tutorial.description}</p>
                    <a href="#" className="btn btn-outline-primary btn-sm">
                      Watch Tutorial <BootstrapIcon name="arrow-right" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row mt-5">
            <div className="col-12">
              <div className="card border-0 shadow-card p-4 text-center" style={{ backgroundColor: '#fff' }}>
                <BootstrapIcon name="question-circle" className="fs-1 text-primary mb-3" />
                <h4 className="fw-bold mb-3">Need More Help?</h4>
                <p className="text-muted mb-4">
                  Our support team is here to help you succeed. Reach out anytime!
                </p>
                <a href="/contact" className="btn btn-primary">
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
