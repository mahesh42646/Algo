'use client';

import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';

export default function PricingPage() {
  const pricingPlans = [
    {
      name: 'Starter',
      price: 'Free',
      period: '',
      features: [
        'Basic trading strategies',
        'Up to 3 connected exchanges',
        'Community support',
        'Basic analytics'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      features: [
        'Advanced AI strategies',
        'Unlimited exchanges',
        'Priority support',
        'Advanced analytics',
        'Custom strategies',
        'Copy trading access'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Everything in Professional',
        'Dedicated account manager',
        'Custom integrations',
        'API access',
        'White-label options',
        '24/7 premium support'
      ],
      popular: false
    }
  ];

  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              Simple, Transparent <span className="primary">Pricing</span>
            </h1>
            <p className="lead text-muted">
              Choose the perfect plan for your trading needs. All plans include our core features.
            </p>
          </div>

          <div className="row g-4 justify-content-center mb-5">
            {pricingPlans.map((plan, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-4">
                <div className={`card h-100 border-0 shadow-card ${plan.popular ? 'border-primary border-2' : ''}`}>
                  <div className="card-body p-4 d-flex flex-column">
                    {plan.popular && (
                      <span className="badge bg-primary mb-3 align-self-start">Most Popular</span>
                    )}
                    <h3 className="fw-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="display-4 fw-bold primary">{plan.price}</span>
                      {plan.period && <span className="text-muted">{plan.period}</span>}
                    </div>
                    <ul className="list-unstyled mb-4 flex-grow-1">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="mb-3 d-flex align-items-start">
                          <BootstrapIcon name="check-circle-fill" className="text-success me-2 mt-1" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="/home/registration"
                      className={`btn w-100 ${plan.popular ? 'btn-primary' : 'btn-outline-primary'}`}
                    >
                      Get Started
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="alert alert-info text-center" role="alert">
            <BootstrapIcon name="info-circle" className="me-2" />
            <strong>Need help choosing?</strong> Contact our sales team for personalized recommendations.
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
