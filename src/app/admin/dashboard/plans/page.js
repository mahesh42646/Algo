'use client';

export default function OurPlans() {
  const plans = [
    {
      name: 'Basic',
      price: 9.99,
      features: [
        '10 Projects',
        '5GB Storage',
        'Basic Support',
        'Email Notifications'
      ],
      activeUsers: 342,
      gradient: 'linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%)'
    },
    {
      name: 'Pro',
      price: 29.99,
      features: [
        'Unlimited Projects',
        '50GB Storage',
        'Priority Support',
        'Advanced Analytics',
        'API Access',
        'Custom Integrations'
      ],
      activeUsers: 456,
      gradient: 'linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)'
    },
    {
      name: 'Premium',
      price: 59.99,
      features: [
        'Unlimited Everything',
        '500GB Storage',
        '24/7 Premium Support',
        'Advanced Analytics',
        'Full API Access',
        'Custom Integrations',
        'Dedicated Account Manager',
        'White-label Options'
      ],
      activeUsers: 94,
      gradient: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)'
    },
  ];

  return (
    <div className="px-2 px-md-3 px-lg-4">
      <div className="d-flex align-items-center mb-3 mb-md-4">
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
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.326 4.81c-.083 0-.125-.018-.125-.125v-.126c0-.072.015-.12.125-.12.622 0 1.005.515 1.119.86a.25.25 0 0 1-.229.292h-.844zm.696-3.554c.08 0 .123.018.123.125v.126c0 .072-.015.12-.123.12h-.59c-.082 0-.123-.018-.123-.125v-.126c0-.072.015-.12.123-.12h.59z"/>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="white" viewBox="0 0 16 16" className="d-none d-md-block">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.326 4.81c-.083 0-.125-.018-.125-.125v-.126c0-.072.015-.12.125-.12.622 0 1.005.515 1.119.86a.25.25 0 0 1-.229.292h-.844zm.696-3.554c.08 0 .123.018.123.125v.126c0 .072-.015.12-.123.12h-.59c-.082 0-.123-.018-.123-.125v-.126c0-.072.015-.12.123-.12h.59z"/>
          </svg>
        </div>
        <h2 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.75rem)' }}>Our Plans</h2>
      </div>

      <div className="row g-3 g-md-4">
        {plans.map((plan, index) => (
          <div key={index} className="col-12 col-md-6 col-lg-4">
            <div
              className="card border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                border: '1px solid rgba(0,0,0,0.05)'
              }}
              onMouseEnter={(e) => {
                if (window.innerWidth > 768) {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,0,0,0.08)';
              }}
            >
              <div
                className="text-white p-3 p-md-4"
                style={{ background: plan.gradient }}
              >
                <h3 className="fw-bold mb-2" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)' }}>{plan.name}</h3>
                <div className="d-flex align-items-baseline mb-3">
                  <span className="fw-bold" style={{ fontSize: 'clamp(1.75rem, 6vw, 2.5rem)' }}>${plan.price}</span>
                  <span className="ms-2 opacity-75" style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>/month</span>
                </div>
                <div className="d-flex align-items-center">
                  <span className="badge bg-light text-dark me-2" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.85rem)', padding: '0.4rem 0.8rem' }}>
                    {plan.activeUsers} Active Users
                  </span>
                </div>
              </div>

              <div className="card-body p-3 p-md-4">
                <ul className="list-unstyled mb-3 mb-md-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="mb-2 mb-md-3 d-flex align-items-start">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="var(--success)"
                        viewBox="0 0 16 16"
                        className="me-2 flex-shrink-0 mt-1"
                        style={{ width: 'clamp(16px, 4vw, 20px)', height: 'clamp(16px, 4vw, 20px)' }}
                      >
                        <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                      </svg>
                      <span style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className="btn w-100 fw-semibold"
                  style={{
                    background: plan.gradient,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.6rem 1rem',
                    fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (window.innerWidth > 768) {
                      e.currentTarget.style.opacity = '0.9';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Manage Plan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
