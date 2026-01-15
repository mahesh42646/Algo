'use client';

import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';

export default function PrivacyPolicyPage() {
  // Structured sections for scalability and clarity
  const lastUpdated = 'December 2024';

  const sections = [
    {
      title: '1. Introduction',
      icon: 'shield-lock',
      content: (
        <p className="text-muted">
          At <span className="fw-semibold primary">AlgoBot</span> (<span className="fst-italic">"we", "our", or "us"</span>), your privacy matters to us. This Privacy Policy transparently explains how we collect, use, disclose, and safeguard your information when you interact with our services and platform.
        </p>
      )
    },
    {
      title: '2. Information We Collect',
      icon: 'database',
      content: (
        <>
          <p className="text-muted mb-3">We may collect and process the following types of information:</p>
          <ul className="text-muted">
            <li>
              <span className="fw-semibold">Account details</span> (e.g., name, email address, password)
            </li>
            <li>
              <span className="fw-semibold">Exchange API keys</span> (encrypted & securely stored)
            </li>
            <li>
              <span className="fw-semibold">Trading preferences & settings</span>
            </li>
            <li>
              <span className="fw-semibold">Communication data</span> (when you contact support or engage with us)
            </li>
            <li>
              <span className="fw-semibold">Usage data</span> (browsing information, device, and log data)
            </li>
          </ul>
        </>
      )
    },
    {
      title: '3. How We Use Your Information',
      icon: 'gear',
      content: (
        <>
          <p className="text-muted mb-3">Your information helps us:</p>
          <ul className="text-muted">
            <li>Deliver and maintain our services</li>
            <li>Process transactions and send confirmations</li>
            <li>Notify you of important updates and provide support</li>
            <li>Respond to your feedback and inquiries</li>
            <li>Monitor, analyze, and enhance usage and performance</li>
            <li>Protect the platform against unauthorized access and abuse</li>
          </ul>
        </>
      )
    },
    {
      title: '4. Data Security',
      icon: 'lock-fill',
      content: (
        <p className="text-muted">
          <span className="fw-semibold">We prioritize your security</span> by implementing industry-standard technical and organizational safeguards. All API keys are encrypted at rest, and sensitive operations are strictly protected. We cannot access your exchange funds or execute withdrawals on your behalf.
        </p>
      )
    },
    {
      title: '5. Data Sharing',
      icon: 'people-arrows',
      content: (
        <>
          <p className="text-muted">
            <span className="fw-semibold">AlgoBot never sells, trades, or rents</span> your personal information to third parties. Information may be shared only:
          </p>
          <ul className="text-muted mb-0">
            <li>With your explicit consent</li>
            <li>As required by law or regulatory process</li>
            <li>To protect our rights, property, or safety</li>
            <li>With trusted service providers who assist in operations (under confidentiality agreements)</li>
          </ul>
        </>
      )
    },
    {
      title: '6. Your Rights',
      icon: 'person-check',
      content: (
        <>
          <p className="text-muted mb-3">You can, subject to applicable law:</p>
          <ul className="text-muted">
            <li>Access your data</li>
            <li>Request correction of inaccuracies</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing</li>
            <li>Request data portability</li>
          </ul>
          <p className="text-muted mb-0">To exercise your rights, please <a href="/contact" className="text-primary text-decoration-none">contact our support</a>.</p>
        </>
      )
    },
    {
      title: '7. Cookies and Tracking',
      icon: 'cookie',
      content: (
        <p className="text-muted">
          We use cookies and similar tracking technologies to enhance your experience, analyze traffic, and customize content. You may set your browser to block cookies, though this may affect certain platform features.
        </p>
      )
    },
    {
      title: '8. Children\'s Privacy',
      icon: 'emoji-smile',
      content: (
        <p className="text-muted">
          Our services are not directed to individuals under 18. We do not knowingly collect personal information from children. If you believe a child has provided us data, please contact us to request removal.
        </p>
      )
    },
    {
      title: '9. Changes to this Policy',
      icon: 'arrow-clockwise',
      content: (
        <p className="text-muted">
          We may update this Privacy Policy from time to time. Changes will be posted on this page, with the "Last updated" date. Significant changes will be communicated via email or platform notifications.
        </p>
      )
    },
    {
      title: '10. Contact Us',
      icon: 'envelope',
      content: (
        <p className="text-muted">
          Have questions or concerns about our Privacy Policy or data practices?<br />
          Email: <a href="mailto:privacy@algobot.com" className="text-primary">privacy@algobot.com</a>
        </p>
      )
    }
  ];

  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="card border-0 shadow-card p-4 p-md-5">
            <div className="d-flex align-items-center mb-1">
              <BootstrapIcon name="shield-lock" className="fs-1 text-primary me-3" />
              <div>
                <h1 className="display-5 fw-bold mb-1">Privacy Policy</h1>
                <span className="text-muted small">Last updated: {lastUpdated}</span>
              </div>
            </div>
            <hr className="my-4" />
            <div>
              {sections.map((s, idx) => (
                <section className="mb-5" key={s.title}>
                  <div className="d-flex align-items-center mb-2">
                    <BootstrapIcon name={s.icon} className="text-primary me-2" style={{ minWidth: 28, fontSize: 22 }} />
                    <h2 className="fw-bold h5 mb-0">{s.title}</h2>
                  </div>
                  <div className="ms-4 pt-1">{s.content}</div>
                </section>
              ))}
            </div>
            <div className="text-center pt-3">
              <a href="/contact" className="btn btn-outline-primary btn-lg px-4 fw-semibold">
                <BootstrapIcon name="chat-left-text" className="me-2" /> Contact Support
              </a>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
