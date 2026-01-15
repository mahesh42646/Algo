'use client';

import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';

const SECTIONS = [
  {
    icon: "file-earmark-text",
    title: '1. Agreement to Terms',
    content: (
      <p className="text-muted">
        By accessing or using <span className="fw-semibold primary">AlgoBot</span>'s services, you agree to these Terms of Service and all applicable laws. If you do not agree, you are prohibited from using our services.
      </p>
    )
  },
  {
    icon: "graph-up-arrow",
    title: '2. Description of Service',
    content: (
      <p className="text-muted">
        <span className="primary fw-semibold">AlgoBot</span> is an AI-powered quantitative trading platform that lets users automate strategies on supported cryptocurrency exchanges. Our service includes trading algorithms, analytics, and related tools.
      </p>
    )
  },
  {
    icon: "person-badge",
    title: '3. User Accounts',
    content: (
      <>
        <p className="text-muted mb-3">To use our services, you must:</p>
        <ul className="text-muted list-unstyled ms-3 mb-0">
          <li><BootstrapIcon name="check-circle" className="text-success me-2" />Be at least 18 years old</li>
          <li><BootstrapIcon name="check-circle" className="text-success me-2" />Provide accurate and complete information</li>
          <li><BootstrapIcon name="shield-lock" className="text-primary me-2" />Maintain the security of your account credentials</li>
          <li><BootstrapIcon name="exclamation-triangle" className="text-warning me-2" />Notify us immediately of any unauthorized access</li>
          <li><BootstrapIcon name="people-fill" className="text-secondary me-2" />Accept responsibility for all activities under your account</li>
        </ul>
      </>
    )
  },
  {
    icon: "link-45deg",
    title: '4. Exchange Integration',
    content: (
      <p className="text-muted">
        When connecting your exchange account, you agree to use API keys with only the necessary permissions. We require <span className="fw-semibold">read</span> and <span className="fw-semibold">trading</span> permissions. <u>We never</u> request withdrawal permissions. You are responsible for the security of your API keys and your exchange account.
      </p>
    )
  },
  {
    icon: "exclamation-diamond",
    title: '5. Trading Risks',
    content: (
      <p className="text-muted">
        Cryptocurrency trading involves a substantial risk of loss. Past performance does not guarantee future results. You acknowledge that you understand the risks and are solely responsible for your trading decisions and outcomes.
      </p>
    )
  },
  {
    icon: "credit-card-2-front",
    title: '6. Fees and Payments',
    content: (
      <p className="text-muted">
        Service fees are always disclosed before you subscribe or upgrade. Fees are charged according to your plan. We may modify pricing with notice. All fees are non-refundable except as required by law.
      </p>
    )
  },
  {
    icon: "ban",
    title: '7. Prohibited Activities',
    content: (
      <>
        <p className="text-muted mb-3">You agree not to:</p>
        <ul className="text-muted list-unstyled ms-3 mb-0">
          <li><BootstrapIcon name="x-circle" className="text-danger me-2" />Use the service for any illegal purpose</li>
          <li><BootstrapIcon name="x-circle" className="text-danger me-2" />Interfere with or disrupt the service</li>
          <li><BootstrapIcon name="x-circle" className="text-danger me-2" />Attempt to reverse engineer our algorithms</li>
          <li><BootstrapIcon name="x-circle" className="text-danger me-2" />Share your account with others</li>
          <li><BootstrapIcon name="robot" className="text-warning me-2" />Use automated systems to access the service without permission</li>
        </ul>
      </>
    )
  },
  {
    icon: "shield-slash",
    title: '8. Limitation of Liability',
    content: (
      <p className="text-muted">
        To the maximum extent permitted by law, <span className="primary fw-semibold">AlgoBot</span> is not liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, revenues, data, use, goodwill, or other intangible losses resulting from your use of our services.
      </p>
    )
  },
  {
    icon: "person-x",
    title: '9. Termination',
    content: (
      <p className="text-muted">
        We may terminate or suspend your account immediately and without prior notice for conduct that we believe violates these terms or is harmful to others, us, or third parties.
      </p>
    )
  },
  {
    icon: "pencil-square",
    title: '10. Changes to Terms',
    content: (
      <p className="text-muted">
        We may modify these terms at any time. We'll notify users of material changes. Your continued use of the service after changes constitutes acceptance of the new terms.
      </p>
    )
  },
  {
    icon: "envelope-at",
    title: '11. Contact Information',
    content: (
      <p className="text-muted">
        Questions? Contact us at <a href="mailto:legal@algobot.com" className="text-primary">legal@algobot.com</a>
      </p>
    )
  }
];

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="card border-0 shadow-card p-4 p-md-5">
            <div className="d-flex align-items-center mb-2">
              <BootstrapIcon name="file-earmark-lock2" className="fs-2 text-primary me-3" />
              <h1 className="display-5 fw-bold m-0">Terms of Service</h1>
            </div>
            <div className="d-flex align-items-center text-muted mb-4 gap-3">
              <BootstrapIcon name="calendar-event" />
              <small className="fst-italic">Last updated: December 2024</small>
            </div>

            {SECTIONS.map((section, idx) => (
              <section className="mb-5" key={section.title}>
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-light p-2 rounded shadow-sm me-3 d-flex align-items-center justify-content-center" style={{ minWidth: 38 }}>
                    <BootstrapIcon name={section.icon} className="fs-5 text-primary" />
                  </div>
                  <h2 className="fw-bold mb-0" style={{ fontSize: "1.35rem" }}>{section.title}</h2>
                </div>
                {section.content}
              </section>
            ))}
          </div>
        </main>
      </div>
      <Footer />

      {/* Page-specific enhancements */}
      <style jsx>{`
        .primary { color: var(--primary); }
        .card {
          background: var(--glass-bg, #fff);
          border-radius: var(--border-radius, 1.25rem);
        }
        .shadow-card {
          box-shadow: var(--shadow-card, 0 6px 24px rgba(34, 55, 167, 0.07));
        }
        ul li {
          margin-bottom: 0.5rem;
        }
        .bg-light {
          background-color: #f5f7fb !important;
        }
      `}</style>
    </>
  );
}
