'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { env } from '@/config/env';

const NAV_ITEMS = [
  { name: "Community", href: "/community" },
  { name: "Tutorial", href: "/tutorial" },
  { name: "Partners", href: "/partners" },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Get current pathname for active tab
  const pathname = typeof window !== "undefined" && window.location ? window.location.pathname : "";

  const languages = [
    'English', 'Arabic', 'Chinese (Simplified)', 'Dutch', 'French',
    'German', 'Italian', 'Portuguese', 'Russian', 'Spanish'
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang);
    setShowLanguageDropdown(false);
  };

  // Utility to check if nav item is active (strict match or match at start)
  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky-top  bg-white shadow-small" style={{ zIndex: 1000 }}>
      <nav className="navbar navbar-expand-lg  navbar-light">
        <div className="container-fluid px-3 px-md-4 px-lg-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <a className="navbar-brand d-flex align-items-center text-decoration-none" href="/">
            <span className="fw-bold fs-1 primary me-2" style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              <i className="bi bi-robot fw-bold display-6  me-2" style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}></i>
{env.APP_NAME}
            </span>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-controls="navbarNav"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}
            id="navbarNav"
          >
            <ul className="navbar-nav ms-auto align-items-center gap-2 gap-lg-3">
              {/* <li className="nav-item position-relative" ref={dropdownRef}>
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2"
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  type="button"
                >
                  <span>🌐</span>
                  <span className="d-none d-md-inline">{selectedLanguage}</span>
                </button>
                {showLanguageDropdown && (
                  <div
                    className="position-absolute top-100 end-0 mt-2 bg-white border rounded shadow-card"
                    style={{ minWidth: '200px', zIndex: 1001 }}
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        className="btn btn-sm w-100 text-start border-0"
                        onClick={() => handleLanguageSelect(lang)}
                        style={{
                          backgroundColor: selectedLanguage === lang ? 'var(--bg-light)' : 'transparent'
                        }}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </li> */}
              {NAV_ITEMS.map((item) => (
                <li className="nav-item" key={item.href}>
                  <a
                    className={`nav-link position-relative px-1 ${isActive(item.href) ? 'fw-bold active-tab' : ''}`}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    {item.name}
                    {isActive(item.href) && (
                      <span
                        className="d-block position-absolute start-0 end-0"
                        style={{
                          height: '3px',
                          background: 'orange',
                          bottom: '-4px',
                          borderRadius: '2px'
                        }}
                      />
                    )}
                  </a>
                </li>
              ))}
              <li className="nav-item d-flex gap-2">
                <a
                  className="btn btn-outline-primary"
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </a>
                <a
                  className="btn btn-primary"
                  href="/auth/registration"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Register
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <style jsx>{`
        .active-tab {
          color: var(--accent, orange) !important;
        }
        .nav-link.active-tab {
          text-underline-offset: 2px;
        }
      `}</style>
    </header>
  );
}
