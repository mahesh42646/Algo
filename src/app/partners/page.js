'use client';

import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';

export default function PartnersPage() {
  const partnerTypes = [
    {
      title: 'Exchange Partners',
      description: 'We partner with leading cryptocurrency exchanges to provide seamless integration.',
      icon: 'currency-exchange'
    },
    {
      title: 'Technology Partners',
      description: 'Collaborating with innovative tech companies to enhance our platform.',
      icon: 'cpu'
    },
    {
      title: 'Community Partners',
      description: 'Working with communities and influencers to grow the AlgoBot ecosystem.',
      icon: 'people'
    },
    {
      title: 'Enterprise Partners',
      description: 'Providing custom solutions for institutions and large-scale traders.',
      icon: 'building'
    }
  ];

  const benefits = [
    'Early access to new features',
    'Dedicated support channels',
    'Marketing support and resources',
    'Revenue sharing opportunities',
    'Co-marketing opportunities'
  ];

  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              Our <span className="primary">Partners</span>
            </h1>
            <p className="lead text-muted">
              We work with industry leaders to provide the best trading experience for our users.
            </p>
          </div>

          <div className="row g-4 mb-5">
            {partnerTypes.map((type, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-3 d-flex">
                <div className="card border-0 shadow-card p-4 h-100 w-100 text-center d-flex flex-column align-items-center">
                  <div className="d-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: "rgba(13,110,253,0.10)",
                    }}
                  >
                    <BootstrapIcon name={type.icon} className="fs-1 text-primary" />
                  </div>
                  <h5 className="fw-bold mb-3">{type.title}</h5>
                  <p className="text-muted small">{type.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="row mb-5">
            <div className="col-12 col-lg-8 mx-auto">
              <div className="card border-0 shadow-card p-4">
                <h3 className="fw-bold mb-4 text-center">Become a Partner</h3>
                <p className="text-muted text-center mb-4">
                  Join our partner program and unlock exclusive benefits and opportunities.
                </p>
                <div className="mb-4">
                  <h5 className="fw-bold mb-3">Partner Benefits:</h5>
                  <ul className="list-unstyled">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="mb-2 d-flex align-items-start">
                        <BootstrapIcon name="check-circle-fill" className="text-success me-2 mt-1" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-center">
                  <a href="/contact" className="btn btn-primary btn-lg">
                    Get in Touch
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
