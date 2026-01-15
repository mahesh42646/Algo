'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 80;
      const elementPosition = element.offsetTop - headerHeight - 20;

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  const footerLinks = {
    product: [
      { label: 'What is AlgoBot?', href: '#what-is', icon: 'bi-puzzle', isHashLink: true },
      { label: 'How It Works', href: '#how-it-works', icon: 'bi-gear', isHashLink: true },
      { label: 'Pricing', href: '/pricing', icon: 'bi-currency-dollar' },
      { label: 'Reviews', href: '#testimonials', icon: 'bi-star', isHashLink: true },
    ],
    resources: [
      { label: 'Tutorial', href: '/tutorial', icon: 'bi-play-circle' },
      { label: 'Documentation', href: '/documentation', icon: 'bi-journal-bookmark' },
      { label: 'Blog', href: '/blog', icon: 'bi-pencil' },
      { label: 'FAQ', href: '#faq', icon: 'bi-question-circle', isHashLink: true },
    ],
    company: [
      { label: 'About Us', href: '/about', icon: 'bi-info-circle' },
      { label: 'Contact Us', href: '/contact', icon: 'bi-envelope' },
      { label: 'Partners', href: '/partners', icon: 'bi-people' },
      { label: 'Community', href: '/community', icon: 'bi-chat-dots' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy', icon: 'bi-shield-lock' },
      { label: 'Terms of Service', href: '/terms', icon: 'bi-file-earmark-text' },
      { label: 'Cookie Policy', href: '/cookies', icon: 'bi-cookie' },
    ],
  };

  const socials = [
    {
      label: "Facebook",
      href: "#",
      icon: "bi-facebook",
      colorClass: "text-primary"
    },
    {
      label: "Twitter",
      href: "#",
      icon: "bi-twitter-x",
      colorClass: "text-dark"
    },
    {
      label: "Instagram",
      href: "#",
      icon: "bi-instagram",
      colorClass: "text-danger"
    },
    {
      label: "YouTube",
      href: "#",
      icon: "bi-youtube",
      colorClass: "text-danger"
    },
    {
      label: "Telegram",
      href: "#",
      icon: "bi-telegram",
      colorClass: "text-primary"
    }
  ];

  return (
    <footer className="text-dark py-5 mt-5 border-top w-100 bg-white mx-0" >
      <div className="container-fluid px-3 px-md-4 px-lg-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>

        <div className="row g-4" >
          <div className="col-lg-4">
            <div className="d-flex align-items-center mb-3">
              <i className="bi bi-robot fw-bold display-6 me-2" style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}></i>
              <h4 className="fw-bold mb-0 primary" style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                AlgoBot</h4>
            </div>
            <p className="text-muted mb-3 small">
              The World's First 100% Crypto Quantitative Trading Bot! AI Powered.<br />
              Trusted by millions of users worldwide.
            </p>
            <div className="d-flex gap-2 mt-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="btn btn-outline-light shadow-sm border-0 d-flex align-items-center justify-content-center rounded-circle"
                  style={{
                    backgroundColor: 'var(--bs-white)',
                    width: '44px',
                    height: '44px',
                    minWidth: '44px',
                    minHeight: '44px',
                    padding: 0
                  }}
                  aria-label={s.label}
                >
                  <i className={`bi ${s.icon} fs-4 ${s.colorClass}`} aria-hidden="true"></i>
                  <span className="visually-hidden">{s.label}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <h5 className="fw-bold mb-3 primary">Product</h5>
            <ul className="list-unstyled">
              {footerLinks.product.map((link, index) => (
                <li key={index} className="mb-2">
                  {link.isHashLink ? (
                    <button
                      onClick={() => scrollToSection(link.href.substring(1))}
                      className="text-muted text-decoration-none d-flex align-items-center gap-2 bg-transparent border-0 p-0"
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={`bi ${link.icon} me-1 text-primary`} aria-hidden="true"></i>
                      {link.label}
                    </button>
                  ) : (
                    <a href={link.href} className="text-muted text-decoration-none d-flex align-items-center gap-2">
                      <i className={`bi ${link.icon} me-1 text-primary`} aria-hidden="true"></i>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <h5 className="fw-bold mb-3 primary">Resources</h5>
            <ul className="list-unstyled">
              {footerLinks.resources.map((link, index) => (
                <li key={index} className="mb-2">
                  {link.isHashLink ? (
                    <button
                      onClick={() => scrollToSection(link.href.substring(1))}
                      className="text-muted text-decoration-none d-flex align-items-center gap-2 bg-transparent border-0 p-0"
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={`bi ${link.icon} me-1 text-primary`} aria-hidden="true"></i>
                      {link.label}
                    </button>
                  ) : (
                    <a href={link.href} className="text-muted text-decoration-none d-flex align-items-center gap-2">
                      <i className={`bi ${link.icon} me-1 text-primary`} aria-hidden="true"></i>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <h5 className="fw-bold mb-3 primary">Company</h5>
            <ul className="list-unstyled">
              {footerLinks.company.map((link, index) => (
                <li key={index} className="mb-2">
                  <a href={link.href} className="text-muted text-decoration-none d-flex align-items-center gap-2">
                        <i className={`bi ${link.icon} me-1 text-primary`} aria-hidden="true"></i>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-6 col-md-3 col-lg-2">
            <h5 className="fw-bold mb-3 primary">Legal</h5>
            <ul className="list-unstyled">
              {footerLinks.legal.map((link, index) => (
                <li key={index} className="mb-2">
                  <a href={link.href} className="text-muted text-decoration-none d-flex align-items-center gap-2">
                    <i className={`bi ${link.icon} me-1 text-primary`} aria-hidden="true"></i>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-4 border-secondary" />

        <div className="row align-items-center">
          <div className="col-md-6 small">
            <p className="text-muted mb-0">
              © {currentYear} | <span className="primary fw-bold">AlgoBot Quantitative Trading</span>. All Rights Reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end small">
            <p className="text-muted mb-0">
              Made with <i className="bi bi-heart-fill text-danger align-baseline"></i> for crypto traders worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

