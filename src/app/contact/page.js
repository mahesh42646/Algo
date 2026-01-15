'use client';

import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';

export default function ContactPage() {
  const contactMethods = [
    {
      icon: 'envelope',
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@algobot.com',
      link: 'mailto:support@algobot.com'
    },
    {
      icon: 'telegram',
      title: 'Telegram',
      description: 'Join our Telegram community',
      contact: '@algobot_support',
      link: 'https://t.me/algobot_support'
    },
    {
      icon: 'clock',
      title: 'Response Time',
      description: 'We typically respond within',
      contact: '24 hours',
      link: null
    }
  ];

  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              Contact <span className="primary">Us</span>
            </h1>
            <p className="lead text-muted">
              Have a question? We're here to help. Reach out to our support team.
            </p>
          </div>

          <div className="row g-4 mb-5">
            {contactMethods.map((method, index) => (
              <div key={index} className="col-12 col-md-4 d-flex">
                <div className="card border-0 shadow-card p-4 h-100 text-center w-100 d-flex flex-column align-items-center">
                  <div
                    className="d-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'rgba(13,110,253,0.10)',
                    }}
                  >
                    <BootstrapIcon name={method.icon} className="fs-1 text-primary" />
                  </div>
                  <h5 className="fw-bold mb-2">{method.title}</h5>
                  <p className="text-muted small mb-3">{method.description}</p>
                  {method.link ? (
                    <a href={method.link} className="text-primary text-decoration-none fw-semibold">
                      {method.contact}
                    </a>
                  ) : (
                    <span className="text-primary fw-semibold">{method.contact}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="row">
            <div className="col-12 col-lg-8 mx-auto">
              <div className="card border-0 shadow-card p-4">
                <h3 className="fw-bold mb-4">Send us a Message</h3>
                <form>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Name</label>
                      <input type="text" className="form-control" placeholder="Your name" required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Email</label>
                      <input type="email" className="form-control" placeholder="your@email.com" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Subject</label>
                      <input type="text" className="form-control" placeholder="How can we help?" required />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Message</label>
                      <textarea className="form-control" rows="5" placeholder="Tell us more..." required></textarea>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary w-100">
                        Send Message
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
