'use client';

import React, { useState } from 'react';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';

/**
 * Demo PDF files, you should replace these with your real guide URLs or improve fetching
 */
const PDF_GUIDES = [
  {
    label: "Getting Started (PDF)",
    href: "/pdfs/algobot-getting-started.pdf",
  },
  {
    label: "API Reference (PDF)",
    href: "/pdfs/algobot-api-reference.pdf",
  },
  {
    label: "Strategy Guide (PDF)",
    href: "/pdfs/algobot-strategy.pdf",
  },
];

const ALL_GUIDES_ZIP = {
  label: "Download All Guides (.zip)",
  href: "/pdfs/all-guides.zip",
};

const DOC_CONTENT = {
  'Getting Started': {
    'Introduction to AlgoBot': {
      steps: [
        {
          title: 'What is AlgoBot?',
          desc: (
            <>
              <p>
                AlgoBot is an automated trading platform powered by advanced algorithms and AI, enabling users to trade cryptocurrencies efficiently and profitably.
              </p>
              <ul>
                <li>AI-powered quantitative strategies</li>
                <li>Works with your own exchange account for full control</li>
                <li>Secure, fast, and easy to use</li>
              </ul>
            </>
          )
        },
        {
          title: 'Key Features',
          desc: (
            <>
              <ul>
                <li>Simple and secure account setup</li>
                <li>Automated trade execution 24/7</li>
                <li>Transparent reporting and analytics</li>
                <li>Customizable strategy selection</li>
              </ul>
            </>
          )
        },
        {
          title: 'Who Can Use?',
          desc: (
            <>
              <p>AlgoBot is designed for newcomers and advanced traders. No coding or prior trading skills required!</p>
            </>
          )
        }
      ]
    },
    'Quick Start Guide': {
      steps: [
        {
          title: 'Step 1: Register',
          desc: (
            <>
              <p>Go to <a href="https://www.algobot.com" target="_blank" rel="noopener noreferrer">algobot.com</a> and click "Sign Up".</p>
            </>
          )
        },
        {
          title: 'Step 2: Secure Account',
          desc: (
            <>
              <p>Verify your email and set a strong password. Activate 2FA for extra security.</p>
            </>
          )
        },
        {
          title: 'Step 3: Connect Exchange & Activate',
          desc: (
            <>
              <p>Follow the setup instructions to connect your crypto exchange (e.g., Binance, OKX). Activate your trading bot with a minimum deposit as shown in the UI.</p>
            </>
          )
        },
        {
          title: 'Step 4: Start Trading',
          desc: (
            <>
              <p>Select your preferred trading strategy. AI will analyze and trade automatically. Monitor your results live.</p>
            </>
          )
        }
      ]
    },
    'Account Setup': {
      steps: [
        {
          title: 'Create an Account',
          desc: (
            <>
              <ol>
                <li>Visit <a href="https://www.algobot.com" target="_blank" rel="noopener noreferrer">algobot.com</a></li>
                <li>Click "Sign Up" and enter your email, password, and invitation code (if any)</li>
                <li>Confirm your email address via the link sent to your inbox</li>
                <li>Set up 2-factor authentication (recommended)</li>
              </ol>
            </>
          )
        },
        {
          title: 'Connect Your Exchange',
          desc: (
            <>
              <ol>
                <li>Go to the "Accounts" or "Exchanges" section after logging in</li>
                <li>Select your exchange (e.g., Binance, OKX)</li>
                <li>Paste your API key and API secret securely (never share these)</li>
                <li>Follow on-screen wizard to finish connecting</li>
              </ol>
            </>
          )
        }
      ]
    }
  },
  'API Reference': {
    'Authentication': {
      steps: [
        {
          title: 'API Authentication',
          desc: (
            <>
              <p>
                Access AlgoBot APIs by providing your unique API key in the <code>Authorization</code> header:
              </p>
              <pre>
                <code>
{`GET /api/v1/user
Authorization: Bearer YOUR_API_KEY`}
                </code>
              </pre>
              <p>Keep your API key secret. Never share or commit it publicly.</p>
            </>
          )
        }
      ]
    },
    'Trading Endpoints': {
      steps: [
        {
          title: 'Placing a Trade',
          desc: (
            <>
              <pre>
                <code>
{`POST /api/v1/trades
Body:
{
  "pair": "BTC/USDT",
  "amount": 100,
  "side": "buy"
}
`}
                </code>
              </pre>
            </>
          )
        },
        {
          title: 'Viewing Trade Status',
          desc: (
            <>
              <pre>
                <code>
{`GET /api/v1/trades/{tradeId}`}
                </code>
              </pre>
            </>
          )
        }
      ]
    },
    'Webhooks': {
      steps: [
        {
          title: 'Creating a Webhook',
          desc: (
            <>
              <p>
                Use webhooks to receive real-time events. Set your webhook URL in API dashboard, and handle POST requests on key events.
              </p>
              <pre>
                <code>
{`POST /api/v1/webhooks
Body:
{
  "url": "https://your-server.com/algobot-events"
}
`}
                </code>
              </pre>
            </>
          )
        }
      ]
    }
  },
  'Guides': {
    'Strategy Configuration': {
      steps: [
        {
          title: 'Choose a Strategy',
          desc: (
            <>
              <ul>
                <li>Conservative, Balanced, or Aggressive trading</li>
                <li>Read descriptions & backtests for each</li>
              </ul>
            </>
          )
        },
        {
          title: 'Customize Parameters',
          desc: (
            <>
              <p>
                Adjust risk level, base currency, trading limits, etc. Default settings work well for most!
              </p>
            </>
          )
        }
      ]
    },
    'Risk Management': {
      steps: [
        {
          title: 'Best Practices',
          desc: (
            <>
              <ul>
                <li>Enable stop loss & take profit features</li>
                <li>Never invest more than you can afford to lose</li>
                <li>Use 2FA and strong passwords</li>
                <li>Check your trade history regularly</li>
              </ul>
            </>
          )
        }
      ]
    },
    'Performance Optimization': {
      steps: [
        {
          title: 'Monitor & Improve',
          desc: (
            <>
              <ul>
                <li>Track bot performance in your AlgoBot dashboard</li>
                <li>Update to latest strategy releases</li>
                <li>Join the AlgoBot community for tips</li>
              </ul>
            </>
          )
        }
      ]
    }
  },
  'Troubleshooting': {
    'Common Issues': {
      steps: [
        {
          title: 'Login Problems',
          desc: (
            <>
              <ul>
                <li>Check your internet connection</li>
                <li>Make sure caps lock is off in your password</li>
                <li>Try resetting your password</li>
              </ul>
            </>
          )
        },
        {
          title: 'Bot Not Trading',
          desc: (
            <>
              <ul>
                <li>Ensure your exchange API is correctly connected</li>
                <li>Check for minimum balance requirements</li>
                <li>Contact support if problem persists</li>
              </ul>
            </>
          )
        }
      ]
    },
    'Error Codes': {
      steps: [
        {
          title: 'Error Code Reference',
          desc: (
            <>
              <ul>
                <li><b>ERR401</b>: Unauthorized - check your API key</li>
                <li><b>ERR500</b>: Server error - try again later</li>
              </ul>
            </>
          )
        }
      ]
    },
    'FAQs': {
      steps: [
        {
          title: 'Frequently Asked Questions',
          desc: (
            <>
              <ul>
                <li><b>How do I change my plan?</b> You can change strategy plans in your dashboard anytime.</li>
                <li><b>Will I lose funds?</b> Your funds remain in your own exchange account for maximum safety.</li>
                <li><b>How do I get support?</b> Use the Contact Support button at the bottom!</li>
              </ul>
            </>
          )
        }
      ]
    }
  }
};

const DOCS_META = [
  {
    category: 'Getting Started',
    items: [
      { title: 'Introduction to AlgoBot', icon: 'book' },
      { title: 'Quick Start Guide', icon: 'rocket-takeoff' },
      { title: 'Account Setup', icon: 'person-check' }
    ]
  },
  {
    category: 'API Reference',
    items: [
      { title: 'Authentication', icon: 'key' },
      { title: 'Trading Endpoints', icon: 'graph-up-arrow' },
      { title: 'Webhooks', icon: 'link-45deg' }
    ]
  },
  {
    category: 'Guides',
    items: [
      { title: 'Strategy Configuration', icon: 'sliders' },
      { title: 'Risk Management', icon: 'shield-check' },
      { title: 'Performance Optimization', icon: 'speedometer2' }
    ]
  },
  {
    category: 'Troubleshooting',
    items: [
      { title: 'Common Issues', icon: 'exclamation-triangle' },
      { title: 'Error Codes', icon: 'bug' },
      { title: 'FAQs', icon: 'question-circle' }
    ]
  }
];

/**
 * Modal step viewer for doc sections
 */
function DocStepViewer({ section, doc, onClose }) {
  const steps = DOC_CONTENT[section][doc]?.steps || [];
  const [step, setStep] = useState(0);

  if (steps.length === 0) return null;

  const isFirst = step === 0;
  const isLast = step === steps.length - 1;

  return (
    <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(36,40,60,0.15)', zIndex: 1050 }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content rounded-4 glass-card shadow-card">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">{doc} <span className="badge bg-primary ms-2">{section}</span></h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body pt-0 pb-1">
            <div>
              <h6 className="fw-semibold mb-2">{steps[step].title}</h6>
              <div className="text-muted mb-3" style={{ fontSize: '1.06rem' }}>
                {steps[step].desc}
              </div>
            </div>
            {/* Step Controls */}
            <div className="d-flex justify-content-between align-items-center mt-4">
              <button
                className="btn btn-outline-secondary"
                disabled={isFirst}
                onClick={() => setStep(s => Math.max(0, s - 1))}
              >
                <BootstrapIcon name="arrow-left" className="me-2" /> Previous
              </button>
              <span className="small text-muted">{step + 1} / {steps.length}</span>
              {isLast ? (
                <button className="btn btn-primary" onClick={onClose}>
                  Finish <BootstrapIcon name="check-lg" className="ms-2" />
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))}
                >
                  Next Step <BootstrapIcon name="arrow-right" className="ms-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Download guides modal
 */
function GuidesDownloadModal({ show, onClose }) {
  if (!show) return null;
  return (
    <div className="modal d-block" tabIndex={-1} style={{ background: 'rgba(36,40,60,0.15)', zIndex: 1050 }}>
      <div className="modal-dialog modal-md modal-dialog-centered">
        <div className="modal-content rounded-4 glass-card shadow-card">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">
              <BootstrapIcon name="download" className="me-2 text-primary" />
              Download AlgoBot PDF Guides
            </h5>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <p className="mb-3 text-muted">Choose a guide to download for offline reading:</p>
            <ul className="list-unstyled mb-3">
              {PDF_GUIDES.map(pdf => (
                <li className="mb-2" key={pdf.href}>
                  <a
                    href={pdf.href}
                    download
                    className="btn btn-outline-primary w-100 text-truncate"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BootstrapIcon name="file-earmark-pdf" className="me-2" />
                    {pdf.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mb-2">
              <a
                href={ALL_GUIDES_ZIP.href}
                download
                className="btn btn-primary w-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BootstrapIcon name="archive" className="me-2" />
                {ALL_GUIDES_ZIP.label}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DocumentationPage() {
  const [openDoc, setOpenDoc] = useState(null);
  const [showGuidesDownload, setShowGuidesDownload] = useState(false);

  // openDoc: {section, docTitle}
  const handleOpenDoc = (section, docTitle) => {
    setOpenDoc({ section, docTitle });
  };
  const handleCloseDoc = () => {
    setOpenDoc(null);
  };

  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              AlgoBot <span className="primary">Documentation</span>
            </h1>
            <p className="lead text-muted">
              Step-by-step guides & API reference for starting, configuring and using AlgoBot easily.
            </p>
          </div>

          <div className="row g-4 mb-5">
            {DOCS_META.map((section) => (
              <div key={section.category} className="col-12 col-md-6">
                <div className="card border-0 shadow-card h-100">
                  <div className="card-body p-4">
                    <h4 className="fw-bold mb-4 primary">{section.category}</h4>
                    <ul className="list-unstyled">
                      {section.items.map((item) => (
                        <li key={item.title} className="mb-3">
                          <button
                            type="button"
                            className="btn btn-link text-decoration-none text-dark d-flex align-items-center w-100 text-start px-0"
                            style={{ outline: 'none', boxShadow: 'none' }}
                            onClick={() => handleOpenDoc(section.category, item.title)}
                          >
                            <BootstrapIcon name={item.icon} className="me-3 text-primary" />
                            <span className="fw-semibold">{item.title}</span>
                            <BootstrapIcon name="chevron-right" className="ms-auto text-muted" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

         
        </main>
        {/* Modal Viewer for Steps */}
        {openDoc && (
          <DocStepViewer
            section={openDoc.section}
            doc={openDoc.docTitle}
            onClose={handleCloseDoc}
          />
        )}
        {/* Modal for Guides Download */}
        <GuidesDownloadModal show={showGuidesDownload} onClose={() => setShowGuidesDownload(false)} />
      </div>
      <Footer />
    </>
  );
}
