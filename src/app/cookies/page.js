'use client';

import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';

const COOKIE_SECTIONS = [
  {
    icon: 'cookie',
    title: '1. What Are Cookies?',
    content: (
      <p className="text-muted">
        Cookies are small text files stored on your device by websites you visit. They enable core functionality, enhance your browsing experience, and provide analytics to site owners. Cookies can be session-based (deleted after you close your browser) or persistent (stored for future visits).
      </p>
    )
  },
  {
    icon: 'sliders',
    title: '2. How We Use Cookies',
    content: (
      <>
        <p className="text-muted mb-3">On <span className="fw-semibold primary">AlgoBot</span>, we use cookies to:</p>
        <ul className="text-muted list-unstyled ms-3">
          <li><BootstrapIcon name="check-circle" className="text-success me-2" />Ensure website security and basic functionality</li>
          <li><BootstrapIcon name="graph-up" className="text-primary me-2" />Analyze site performance and usage</li>
          <li><BootstrapIcon name="gear" className="text-warning me-2" />Remember your preferences (e.g. language, theme)</li>
          <li><BootstrapIcon name="bar-chart-line" className="text-info me-2" />Improve services based on aggregated analytics</li>
        </ul>
      </>
    )
  },
  {
    icon: 'table',
    title: '3. Types of Cookies We Use',
    content: (
      <div className="table-responsive">
        <table className="table table-bordered align-middle shadow-small mb-0">
          <thead className="table-light">
            <tr>
              <th scope="col" style={{ minWidth: 150 }}>Cookie Name</th>
              <th scope="col">Purpose</th>
              <th scope="col" style={{ minWidth: 100 }}>Duration</th>
              <th scope="col">Category</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>session_id</td>
              <td>Maintains user authentication and session state</td>
              <td>Session</td>
              <td>Essential</td>
            </tr>
            <tr>
              <td>preferences</td>
              <td>Stores user preference settings (language, mode, etc.)</td>
              <td>1 year</td>
              <td>Functionality</td>
            </tr>
            <tr>
              <td>analytics</td>
              <td>Tracks anonymous website analytics</td>
              <td>2 years</td>
              <td>Analytics</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  },
  {
    icon: 'globe2',
    title: '4. Third-Party Cookies',
    content: (
      <p className="text-muted">
        We may allow trusted analytics providers (like Google Analytics) to set cookies on your device. These third-party cookies help us understand user behavior and improve our platform. They may track your activity across other sites and build aggregate, anonymized usage profiles. Please refer to each partner’s privacy policy for details.
      </p>
    )
  },
  {
    icon: 'sliders2',
    title: '5. Managing Your Cookie Preferences',
    content: (
      <>
        <p className="text-muted mb-2">
          You’re in control. You can manage cookies through your browser settings:
        </p>
        <ul className="text-muted list-unstyled ms-3 mb-3">
          <li><BootstrapIcon name="chrome" className="text-secondary me-2" /><strong>Chrome:</strong> Settings &rarr; Privacy and security &rarr; Cookies and other site data</li>
          <li><BootstrapIcon name="fire" className="text-warning me-2" /><strong>Firefox:</strong> Options &rarr; Privacy &amp; Security &rarr; Cookies and Site Data</li>
          <li><BootstrapIcon name="apple" className="text-dark me-2" /><strong>Safari:</strong> Preferences &rarr; Privacy &rarr; Cookies and website data</li>
          <li><BootstrapIcon name="windows" className="text-info me-2" /><strong>Edge:</strong> Settings &rarr; Privacy, search, and services &rarr; Cookies</li>
        </ul>
        <p className="text-muted mb-0">
          Blocking certain cookies may impact website features or performance.
        </p>
      </>
    )
  },
  {
    icon: 'arrow-clockwise',
    title: '6. Updates to This Policy',
    content: (
      <p className="text-muted">
        We may update our Cookie Policy to reflect changes in technology, legislation, or our use of cookies. Any updates will appear on this page with a revised date.
      </p>
    )
  },
  {
    icon: 'envelope',
    title: '7. Contact Us',
    content: (
      <p className="text-muted mb-0">
        If you have questions about cookies or privacy, contact our Data Protection Officer at{' '}
        <a href="mailto:privacy@algobot.com" className="text-primary fw-semibold">privacy@algobot.com</a>
        .
      </p>
    )
  }
];

export default function CookiePolicyPage() {
  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="card border-0 shadow-card p-4 p-md-5">
            <div className="d-flex align-items-center gap-3 mb-1">
              <BootstrapIcon name="cookie" className="display-5 text-primary" />
              <h1 className="display-5 fw-bold mb-0">Cookie Policy</h1>
            </div>
            <p className="text-muted mb-4">Last updated: December 2024</p>

            {COOKIE_SECTIONS.map((section, idx) => (
              <section className="mb-5" key={section.title}>
                <div className="d-flex align-items-center gap-2 mb-3">
                  <BootstrapIcon name={section.icon} className="fs-4 text-accent" />
                  <h2 className="fw-bold h4 mb-0">{section.title}</h2>
                </div>
                {section.content}
              </section>
            ))}

            <div className="alert alert-secondary d-flex align-items-center gap-2 p-3 mt-4 shadow-small" role="alert">
              <BootstrapIcon name="shield-lock" className="fs-5 text-primary" />
              <span className="fw-semibold">We never use cookies to access sensitive data or for advertising.</span>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
