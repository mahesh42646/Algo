'use client';

import Header from './components/Header';
import Footer from './components/Footer';
import Image from 'next/image';
import BootstrapIcon from './components/BootstrapIcon';

export default function HomePage() {
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
  return (
    <>
    <Header />
    <div className="min-vh-100 px-lg-5" style={{ backgroundColor: '#f3f5fe' }}>
      
      
      <main className="px-3 px-lg-5 mx-lg-5 py-3">
        {/* Hero Section */}
        <section className="py-3 py-md-4">
          <div className="py-2 py-md-3">
            <div className="row align-items-center">
              <div className="col-12 col-lg-6 mb-4 mb-lg-0">
                <h1 className="fw-bold py-2" style={{ color: 'var(--text-dark)', fontSize: 'clamp(2rem, 5vw, 4.1rem)', lineHeight: '1.2' }}>
                  Trade with a global crypto bot to achieve your investment goals.
                </h1>
                
                <div className="d-flex align-items-center gap-2 gap-md-3 mb-3">
                  <div className="d-flex align-items-center">
                    <span className="fw-bold fs-5 fs-md-4 me-2" style={{ color: 'var(--text-dark)' }}>AlgoBot</span>
                    <span className="text-muted fs-6 fs-md-5">trading app</span>
                  </div>
                </div>
                
                <div className="d-flex align-items-center gap-3 gap-md-5 mb-3 mb-md-4">
                  <div className="d-flex align-items-center">
                    <span className="fw-bold fs-5 fs-md-4 me-2" style={{ color: 'var(--text-dark)' }}>4.2</span>
                    <span className="text-warning" style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)' }}><BootstrapIcon name="star-fill" /><BootstrapIcon name="star-fill" /><BootstrapIcon name="star-fill" /><BootstrapIcon name="star-fill" /><BootstrapIcon name="star-fill" /></span>
                  </div>
                  <div className="d-flex align-items-center">
                    <span className="fw-bold fs-5 fs-md-4 me-2" style={{ color: 'var(--text-dark)' }}>4.6</span>
                    <span className="text-warning" style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)' }}><BootstrapIcon name="star-fill" /><BootstrapIcon name="star-fill" /><BootstrapIcon name="star-fill" /><BootstrapIcon name="star-fill" /><BootstrapIcon name="star-fill" /></span>
                  </div>
                </div>
                
                <div className="d-flex flex-column flex-sm-row gap-2 gap-md-3 mb-3 mb-md-4">
                  <a href="#" className="btn btn-outline-dark px-3 px-md-4 py-2 py-md-3" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                    <BootstrapIcon name="google-play" className="d-inline-block me-2" />
                    Google Play
                  </a>
                  <a href="#" className="btn btn-outline-dark px-3 px-md-4 py-2 py-md-3" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
                    <BootstrapIcon name="apple" className="d-inline-block me-2" />
                    App Store
                  </a>
                </div>
                
                <h2 className="h2 fw-bold mb-3 mb-md-4" style={{ color: 'var(--text-dark)', fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
                  Empower your trading experience
                </h2>
                <p className="mb-4 mb-md-5" style={{ color: 'var(--text-gray)', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}>
                  Trade with a reliable and transparent global crypto quantitative trading bot.
                </p>
                
                <a href="/auth/registration" className="btn btn-primary btn-lg px-4 px-md-5 py-2 w-l100 w-sm-auto" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.1rem)', fontWeight: '600' }}>
                  Open account
                </a>
              </div>
              <div className="col-12 col-lg-6 text-center">
                <div className="position-relative d-flex align-items-center justify-content-center" style={{ minHeight: 'clamp(300px, 50vw, 700px)', overflow: 'visible' }}>
                  <Image
                    src="/Hero.png"
                    alt="AlgoBot Trading App"
                    className="img-fluid"
                    width={1000}
                    height={1000}
                    style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Navigation Banner Section */}
        <section className="pb-4 pb-md-5">
          <div style={{ margin: '0 auto' }}>
            <div className="border-0 p-3 p-md-2 shadow-md bg-white rounded-4">
              <div className="row text-center pb-2 pb-md-3 g-2 g-md-0">

                <div
                  className="col-6 col-md-3 my-auto algobot-icon-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => scrollToSection('trading-conditions')}
                >
                  <Image src="/set.png" alt="Trading Settings" width={80} height={80} className="img-fluid" style={{ maxWidth: 'clamp(60px, 15vw, 100px)', height: 'auto' }} />
                  <p className="mb-0 mb-md-1 fw-bold" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>Trading Settings</p>
                </div>

                <div
                  className="col-6 col-md-3 my-auto algobot-icon-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => scrollToSection('three-ways')}
                >
                  <Image src="/pro.png" alt="Ways to Profit" width={80} height={80} className="img-fluid" style={{ maxWidth: 'clamp(60px, 15vw, 100px)', height: 'auto' }} />
                  <p className="mb-0 mb-md-1 fw-bold" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>Ways to Profit</p>
                </div>

                <div
                  className="col-6 col-md-3 my-auto algobot-icon-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => scrollToSection('what-is')}
                >
                  <Image src="/robot.png" alt="About AlgoBot" width={80} height={80} className="img-fluid" style={{ maxWidth: 'clamp(60px, 15vw, 100px)', height: 'auto' }} />
                  <p className="mb-0 mb-md-1 fw-bold" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>About AlgoBot</p>
                </div>

                <div
                  className="col-6 col-md-3 my-auto algobot-icon-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => scrollToSection('register')}
                >
                  <Image src="/mobile.png" alt="Get Started" width={80} height={80} className="img-fluid" style={{ maxWidth: 'clamp(60px, 15vw, 100px)', height: 'auto' }} />
                  <p className="mb-0 mb-md-1 fw-bold" style={{ fontSize: 'clamp(0.75rem, 2vw, 1rem)' }}>Get Started</p>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* What is AlgoBot Section */}
        <section id="what-is" className="py-4 py-md-5">
          <div className="">
            <div className="row align-items-center g-4">

              {/* LEFT CONTENT */}
              <div className="col-12 col-lg-6 order-2 order-lg-1">
                <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
                  <span className="primary">AlgoBot</span> – AI & Quantitative Trading for Cryptocurrency
                </h2>

                <p className="text-muted mb-3" style={{ fontSize: 'clamp(0.95rem, 2vw, 1rem)' }}>
                  <strong>AlgoBot trading robot</strong> is artificial intelligence (AI) and quantitative trading based on a set of cryptocurrency trading signals that helps determine whether to buy or sell a crypto pair at a given point in time using mathematical models and algorithms instead of human intuition.
                </p>

                <p className="text-muted mb-3" style={{ fontSize: 'clamp(0.95rem, 2vw, 1rem)' }}>
                  Quantitative trading by AI removes the psychological element of trading, which is often harmful in crypto investments.
                </p>

                <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.95rem, 2vw, 1rem)' }}>
                  AlgoBot works <strong>24/7</strong> with multiple automated strategies. Beginners can simply copy strategies from experienced traders and start trading confidently.
                </p>
              </div>

              {/* RIGHT CARD */}
              <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center order-1 order-lg-2">
                <div className="border-0 w-100">
                  <div className="">
                    <div className="d-flex flex-column align-items-center mb-0">
                      <div className="mb-0 w-100 d-flex justify-content-center">
                        {/* Video introduction: To update the video, add your link here */}
                        <div className="ratio ratio-16x9 w-100 rounded shadow" style={{ maxWidth: 600, background: '#f4f4f4' }}>
                          <iframe
                            src="https://www.youtube.com/embed/vmGhZqQc9eY"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="AlgoBot intro video"
                            style={{ border: 0, width: '100%', height: '100%' }}
                          ></iframe>
                        </div>
                        {/* To change the video, replace the src link above */}
                      </div>
                      
                    </div>
                   
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Information Cards Grid */}
        <section className="py-5 bg-">
          <div className="">
            <h2 className="fw-bold text-center mb-5 display-5 slide-up">
              Why Choose <span className="primary">AlgoBot?</span>
            </h2>
            <div className="row g-4">

              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 glass-card algo-card-hover shadow-card p-4 text-center slide-up">
                  <div className="d-flex flex-column align-items-center mb-3">
                    <div className="algo-icon-circle d-flex align-items-center justify-content-center mb-2">
                      <Image src="/robot.png" alt="What is AlgoBot" width={70} height={70} className="mb-0" />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3">What is AlgoBot?</h5>
                  <p className="text-muted mb-3 small">
                    AlgoBot is a user-friendly AI quantitative trading system for cryptocurrency. Just connect your exchange (Binance, Kraken, Coinbase, etc.) and let advanced strategies work for you.
                  </p>
                  <button onClick={() => scrollToSection('what-is')} className="btn btn-outline-primary btn-sm mt-auto px-3 fw-semibold rounded-pill">
                    Learn About Quant Trading
                  </button>
                </div>
              </div>

              {/* IS LEGIT */}
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 glass-card algo-card-hover shadow-card p-4 text-center slide-up">
                  <div className="d-flex flex-column align-items-center mb-3">
                    <div className="algo-icon-circle d-flex align-items-center justify-content-center mb-2 bg-success bg-opacity-10">
                      <BootstrapIcon name="check-circle" className="fs-2" />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3">Is AlgoBot Legit?</h5>
                  <p className="text-muted mb-3 small">
                    AlgoBot has been trusted globally since 2017, serving thousands of traders with robust security, transparent results, and an active 24/7 support team. Your security is our priority.
                  </p>
                  <button onClick={() => scrollToSection('is-legit')} className="btn btn-outline-success btn-sm mt-auto px-3 fw-semibold rounded-pill">
                    Explore Security & Trust
                  </button>
                </div>
              </div>

              {/* TRADE SETTINGS */}
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 glass-card algo-card-hover shadow-card p-4 text-center slide-up">
                  <div className="d-flex flex-column align-items-center mb-3">
                    <div className="algo-icon-circle d-flex align-items-center justify-content-center mb-2">
                      <Image src="/set.png" alt="Trade Settings" width={70} height={70} />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3">Flexible Trade Settings</h5>
                  <p className="text-muted mb-3 small">
                    Customize your trading – set your entry, risk levels, margin calls, and let AlgoBot automate everything. Ideal for both beginners and advanced traders.
                  </p>
                  <button onClick={() => scrollToSection('trading-conditions')} className="btn btn-outline-primary btn-sm mt-auto px-3 fw-semibold rounded-pill">
                    See Strategy Options
                  </button>
                </div>
              </div>

              {/* HOW IT WORKS */}
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 glass-card algo-card-hover shadow-card p-4 text-center slide-up">
                  <div className="d-flex flex-column align-items-center mb-3">
                    <div className="algo-icon-circle d-flex align-items-center justify-content-center mb-2 bg-primary bg-opacity-10">
                      <BootstrapIcon name="arrow-repeat" className="fs-2" />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3">How AlgoBot Works</h5>
                  <p className="text-muted mb-3 small">
                    Get started in three steps: Sign up, connect your exchange via API, and choose your coins. The AI takes care of analysis, buys, and sells 24/7.
                  </p>
                  <button onClick={() => scrollToSection('how-it-works')} className="btn btn-outline-primary btn-sm mt-auto px-3 fw-semibold rounded-pill">
                    How It Works
                  </button>
                </div>
              </div>

              {/* REGISTRATION */}
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 glass-card algo-card-hover shadow-card p-4 text-center slide-up">
                  <div className="d-flex flex-column align-items-center mb-3">
                    <div className="algo-icon-circle d-flex align-items-center justify-content-center mb-2">
                      <Image src="/mobile.png" alt="Registration" width={70} height={70} />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3">Easy Registration</h5>
                  <p className="text-muted mb-3 small">
                    Register on mobile or web in under 2 minutes! Download AlgoBot from the App Store or Google Play – use code <strong>P3Z5N</strong> and start your journey.
                  </p>
                  <button onClick={() => scrollToSection('register')} className="btn btn-outline-primary btn-sm mt-auto px-3 fw-semibold rounded-pill">
                    Quick Registration
                  </button>
                </div>
              </div>

              {/* REVIEWS */}
              <div className="col-md-6 col-lg-4">
                <div className="card h-100 border-0 glass-card algo-card-hover shadow-card p-4 text-center slide-up">
                  <div className="d-flex flex-column align-items-center mb-3">
                    <div className="algo-icon-circle d-flex align-items-center justify-content-center mb-2 bg-warning bg-opacity-10">
                      <BootstrapIcon name="star" className="fs-2" />
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3">Users Love AlgoBot</h5>
                  <p className="text-muted mb-3 small">
                    Thousands of happy traders highlight our user experience, profit transparency, rapid withdrawals, and responsive support. Join the community!
                  </p>
                  <button onClick={() => scrollToSection('testimonials')} className="btn btn-outline-warning btn-sm mt-auto px-3 fw-semibold rounded-pill">
                    Read Reviews
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Cards Hover Style */}
          <style jsx>{`
            .algo-card-hover {
              transition: transform 0.19s cubic-bezier(.61,1.14,.2,1), box-shadow .19s;
              cursor: pointer;
            }
            .algo-card-hover:hover {
              transform: translateY(-8px) scale(1.03);
              box-shadow: 0 8px 26px rgba(33,77,255,0.12), 0 0px 2px 0 var(--primary);
              border: 1.5px solid var(--primary);
              z-index: 1;
            }
            .algo-icon-circle {
              width: 79px;
              height: 79px;
              border-radius: 50%;
              background: var(--glass-bg,rgba(240,251,255,0.49));
              box-shadow: var(--shadow-small, 0 2px 10px rgba(110,153,255,0.09));
              display: flex;
              align-items: center;
              justify-content: center;
              margin-bottom: 3px;
              transition: box-shadow .2s, background .2s;
            }
            .algo-card-hover:hover .algo-icon-circle {
              background: var(--primary, #FF6B35);
              box-shadow: 0 4px 20px rgba(33,77,255,0.13);
            }
            .algo-card-hover:hover .algo-icon-circle > span,
            .algo-card-hover:hover .algo-icon-circle > img {
              filter: brightness(1.23) contrast(1.08);
            }
          `}</style>
        </section>


        {/* AlgoBot Trust & Legitimacy Section */}
        <section id="is-legit" className="py-5 bg-white">
          <div className="">
            <div className="row justify-content-center">
              <div className="col-lg-9">
                <div className="text-center mb-4">
                  <h2 className="display-5 fw-bold mb-4">
                    Is AlgoBot <span className="success">Legit</span> or <span className="primary">Scam</span>?
                  </h2>
                  <p className="lead text-muted mb-0">
                    Discover why AlgoBot is one of the most trusted, established and secure AI crypto trading bots in the world.
                  </p>
                </div>
                <div className="  p-4 mb-4 mx-auto" style={{maxWidth: 750, backgroundColor: '#f3f5fe'}}>
                  <div className="row g-0 justify-content-center align-items-center">
                    <div className="col-md-10 mx-auto">
                      <div className="d-flex flex-column align-items-center">
                        <div className="mb-3">
                          <span className="badge bg-primary fs-6 px-3 py-2 mb-1">
                            <i className="bi bi-lightning-charge me-1"></i>
                            Running Since 2017
                          </span>
                        </div>
                        <p className="lead fw-normal mb-3">
                          <span className="fw-bold text-success">AlgoBot</span> has operated as a reputable AI-powered quantitative trading platform since <span className="fw-bold">2017</span>. Recognized world-wide and trusted by thousands, AlgoBot delivers proven security, flexible strategies, and transparency for every user.
                        </p>
                        <ul className="list-unstyled row row-cols-1 row-cols-md-3 g-2 mb-4 w-100 justify-content-center">
                          <li className="col d-flex flex-column align-items-center">
                            <div className="mb-2">
                              <span className="badge bg-success"><i className="bi bi-shield-check"></i></span>
                            </div>
                            <span className="small fw-semibold">Industry-Leading Protection</span>
                          </li>
                          <li className="col d-flex flex-column align-items-center">
                            <div className="mb-2">
                              <span className="badge bg-primary"><i className="bi bi-cpu"></i></span>
                            </div>
                            <span className="small fw-semibold">Genuine AI Algorithmic Trades</span>
                          </li>
                          <li className="col d-flex flex-column align-items-center">
                            <div className="mb-2">
                              <span className="badge bg-warning text-dark"><i className="bi bi-people"></i></span>
                            </div>
                            <span className="small fw-semibold">Trusted by Global Crypto Traders</span>
                          </li>
                        </ul>
                        <div className="alert alert-info py-2 mb-2 w-100 border-info d-flex align-items-center justify-content-center" role="alert">
                          <i className="bi bi-key me-2"></i>
                          <span className="small">
                            For <span className="fw-semibold">maximum security</span>: Always enable <span className="fw-semibold">2FA</span> and set strong, unique passwords on your linked exchanges.
                          </span>
                        </div>
                        <div className="mt-2">
                          <button onClick={() => scrollToSection('is-legit')} className="btn btn-outline-primary btn-sm px-3 rounded-pill fw-semibold">
                            Learn More About Security
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <span className="badge bg-success text-white fw-normal px-3 py-2">
                    <i className="bi bi-award me-1"></i>
                    Proven Track Record for Over 7 Years
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How AlgoBot Works */}
        <section id="how-it-works" className="py-5">
          <div>
            <h2 className="display-5 fw-bold text-center mb-5">
            How AlgoBot<span className="primary"> Works</span>
            </h2>
            <div className="row g-4">
              
              <div className="col-md-4">
                <div className="card h-100 p-4 text-center how-card transition">
                  <div className="mb-3 d-flex justify-content-center align-items-center">
                    <Image src="/mobile.png" alt="Download AlgoBot App" width={70} height={70} className="mb-0" />
                  </div>
                  <h4 className="fw-bold mb-2">1. Download App</h4>
                  <p className="mb-0 text-muted">
                    Get the AlgoBot app from the 
                    <span className="fw-semibold d-inline-block mx-1">App Store</span>
                    or
                    <span className="fw-semibold d-inline-block mx-1">Google Play</span>.
                    Sign up using your email & invitation code to create your account.
                  </p>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="card h-100 p-4 text-center how-card transition">
                  <div className="mb-3 d-flex justify-content-center align-items-center">
                    <BootstrapIcon name="link-45deg" className="fs-1" />
                  </div>
                  <h4 className="fw-bold mb-2">2. Connect Exchange</h4>
                  <p className="mb-0 text-muted">
                    Securely link your Binance (or supported exchange) account by connecting your API keys.
                    <span className="d-block text-success fw-semibold mt-1">
                      AlgoBot never withdraws funds; your assets stay in your account.
                    </span>
                  </p>
                </div>
              </div>

              <div className="col-md-4">
                <div className="card h-100 p-4 text-center how-card transition">
                  <div className="mb-3 d-flex justify-content-center align-items-center">
                    <BootstrapIcon name="rocket-takeoff" className="fs-1" />
                  </div>
                  <h4 className="fw-bold mb-2">3. Start Trading</h4>
                  <p className="mb-0 text-muted">
                    Run AlgoBot to trade for you automatically, 24/7. Choose your trading strategy or simply copy successful traders—and watch your portfolio grow.
                  </p>
                </div>
              </div>

            </div>
          </div>
          <style jsx>{`
            .how-card {
              border: 0;
              border-radius: var(--border-radius, 1rem);
              box-shadow: var(--shadow-card, 0 2px 24px rgba(0,0,0,0.07));
              background: var(--glass-bg, #fff);
              cursor: pointer;
              transition: box-shadow 0.25s, transform 0.22s;
              position: relative;
              z-index: 1;
            }
            .how-card:hover, .how-card:focus-visible {
              box-shadow: 0 8px 36px 0 rgba(0, 104, 255, 0.15), 0 1.5px 18px 0 rgba(0, 0, 0, 0.11);
              transform: translateY(-5px) scale(1.025);
              background: var(--glass-bg, #f9fbfe);
              border: 0.5px solid var(--primary, #FF6B35);
            }
            .how-card .fs-1,
            .how-card img {
              transition: transform .18s;
            }
            .how-card:hover .fs-1,
            .how-card:hover img {
              transform: scale(1.1);
            }
          `}</style>
        </section>

        {/* Trading Settings */}
        <section id="trading-conditions" className="py-5 bg-white border-top border-bottom">
          <div className="">
            <div className="row justify-content-center">
              <div className="col-lg-10 col-xl-8">
                <div className="text-center mb-5">
                  <h2 className="display-5 fw-bold mb-3">Master Your Trading <span className="primary">Settings</span></h2>
                  <p className="lead text-muted">
                    AlgoBot gives you professional-grade tools, simplified for everyone. Take control with smart risk management, powerful automation, and settings tailored to your goals.
                  </p>
                </div>
                <div className="row g-4">
                  {/* First Buy-in Amount */}
                  <div className="col-md-4">
                    <div className="card shadow-card glass-card bg- border-0 h-100 p-4 d-flex flex-column align-items-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3" style={{width: 60, height: 60}}>
                        <BootstrapIcon name="cash-coin" className="fs-2 text-primary" />
                      </div>
                      <h5 className="fw-semibold mb-2">First Buy-in Amount</h5>
                      <p className="text-muted small flex-grow-1 mb-3">
                        Set the initial purchase value per trade. Start small or big—flexibility is yours to manage risk and exposure.
                      </p>
                      <div className="badge bg-primary-subtle text-primary px-3">Capital Control</div>
                    </div>
                  </div>
                  {/* Margin Call Options */}
                  <div className="col-md-4">
                    <div className="card shadow-card glass-card border-0 h-100 p-4 d-flex flex-column align-items-center">
                      <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3" style={{width: 60, height: 60}}>
                        <BootstrapIcon name="graph-up-arrow" className="fs-2 text-success" />
                      </div>
                      <h5 className="fw-semibold mb-2">Margin Call Strategy</h5>
                      <p className="text-muted small flex-grow-1 mb-3">
                        Activate automated averaging—AlgotBot buys more on dips. Optionally double the amount every call for dynamic compounding.
                      </p>
                      <div className="badge bg-success-subtle text-success px-3">Auto DCA</div>
                    </div>
                  </div>
                  {/* Profit & Stop Controls */}
                  <div className="col-md-4">
                    <div className="card shadow-card glass-card border-0 h-100 p-4 d-flex flex-column align-items-center">
                      <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-3" style={{width: 60, height: 60}}>
                        <BootstrapIcon name="shield-shaded" className="fs-2 text-danger" />
                      </div>
                      <h5 className="fw-semibold mb-2">Take-Profit / Stop-Loss</h5>
                      <p className="text-muted small flex-grow-1 mb-3">
                        Lock in profits and protect your capital. Pre-set your targets and safety stops—AlgoBot manages exits for you.
                      </p>
                      <div className="badge bg-danger-subtle text-danger px-3">Risk Shield</div>
                    </div>
                  </div>
                </div>
                <div className="row mt-5">
                  <div className="col text-center">
                    <a
                      href="/auth/registration"
                      className="btn btn-primary btn-lg px-5 py-2 rounded-3 fw-semibold shadow-card"
                    >
                      Create My Free Account
                    </a>
                  </div>
                </div>
                <div className="alert alert-info mt-5 mx-auto text-center" style={{ maxWidth: 540 }}>
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                    <BootstrapIcon name="lightbulb" className="fs-5" />
                    <strong>Need Help?</strong>
                  </div>
                  <span>
                    Unsure how to adjust your robot settings? <br />
                    Access our <span className="fw-semibold text-primary">in-app tutorials</span> or 
                    <a href="https://t.me/algobot_support" className="ms-1 link-primary" target="_blank" rel="noopener noreferrer">join our Telegram support</a>.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Ways to Profit */}
        <section id="three-ways" className="py-5 ">
          <div className="">
            <h2 className="display-5 fw-bold text-center mb-4">
              3 Powerful Ways to Profit with <span className="primary">AlgoBot</span>
            </h2>
            <p className="lead text-center text-muted mb-5" style={{maxWidth:600, margin:'0 auto'}}>
              Unlock multiple earning streams - trade, collaborate, and grow with a thriving global crypto community. 
            </p>
            <div className="row g-4">
              {/* 1. Connect to Exchange */}
              <div className="col-md-6 col-lg-4 d-flex">
                <div className="card glass-card shadow-card border-0 h-100 p-4 d-flex flex-column text-center align-items-center">
                  <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                    <BootstrapIcon name="link-45deg" className="fs-2 text-primary" />
                  </div>
                  <h5 className="fw-bold mb-2">Connect to Exchanges</h5>
                  <p className="mb-3 small text-muted">
                    <strong>Link AlgoBot securely with Binance, Huobi, and more</strong> to auto-trade directly from your own crypto exchange accounts.
                  </p>
                  <ul className="text-start mb-3 small text-muted list-unstyled w-100">
                    <li><i className="bi bi-shield-check text-primary me-2"></i>Secure API integration</li>
                    <li><i className="bi bi-person-gear text-primary me-2"></i>Full portfolio control</li>
                  </ul>
                  {/* <div className="mt-auto d-flex justify-content-center w-100"></div> */}
                </div>
              </div>

              {/* 2. Social Trading Community */}
              <div className="col-md-6 col-lg-4 d-flex">
                <div className="card glass-card shadow-card border-0 h-100 p-4 d-flex flex-column text-center align-items-center">
                  <div className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                    <BootstrapIcon name="globe2" className="fs-2 primary" />
                  </div>
                  <h5 className="fw-bold mb-2">Trader Social Network</h5>
                  <p className="mb-3 small text-muted">
                    <strong>Join, follow, or become a <span className="primary">AlgoBot Social Trader</span>.</strong> Share strategies, learn, and lead via Circles.
                  </p>
                  <ul className="text-start mb-3 small text-muted list-unstyled w-100">
                    <li><i className="bi bi-people-fill text-primary me-2"></i>Grow your followers globally</li>
                    <li><i className="bi bi-graph-up-arrow text-primary me-2"></i>Manual 100+ trades &amp; $1000 gain = Admin status</li>
                  </ul>
                </div>
              </div>

              {/* 3. Affiliate & Rewards */}
              <div className="col-md-12 col-lg-4 d-flex">
                <div className="card glass-card shadow-card border-0 h-100 p-4 d-flex flex-column text-center align-items-center">
                  <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-3" style={{ width: 64, height: 64 }}>
                    <BootstrapIcon name="cash-coin" className="fs-2 text-success" />
                  </div>
                  <h5 className="fw-bold mb-2">Use &amp; Share to Earn</h5>
                  <p className="mb-3 small text-muted">
                    <strong>Refer friends, teach new users –</strong> get rewarded via an excellent affiliate plan &amp; team bonuses.
                  </p>
                  <ul className="text-start mb-3 small text-muted list-unstyled w-100">
                    <li><i className="bi bi-gift text-success me-2"></i>Earn commission &amp; bonuses</li>
                    <li><i className="bi bi-megaphone text-success me-2"></i>Advisor leadership opportunities</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Registration + Benefits Section */}
        <section id="register" className="py-5 bg-white border-top">
          <div className="container">
            <div className="row justify-content-center align-items-stretch">
              {/* Stepper and CTA */}
              <div className="col-lg-6 d-flex flex-column">
                <h2 className="display-5 fw-bold text-center text-lg-start mb-4">
                  Join AlgoBot in 3 Easy <span className="primary">Steps</span>
                </h2>
                <ul className="list-group list-group-flush mb-4">
                  <li className="list-group-item d-flex align-items-center border-0 px-0 py-3">
                    <span className="badge bg-success rounded-pill me-3">1</span>
                    <span><strong>Sign up</strong> at <a href="https://www.algobot.com" target="_blank" rel="noopener noreferrer" className="text-success">algobot.com</a> or open the app</span>
                  </li>
                  <li className="list-group-item d-flex align-items-center border-0 px-0 py-3">
                    <span className="badge bg-success rounded-pill me-3">2</span>
                    <span><strong>Secure your account:</strong> Email, password, and verify (Invitation Code: <span className="primary fw-semibold">P3Z5N</span>)</span>
                  </li>
                  <li className="list-group-item d-flex align-items-center border-0 px-0 py-3">
                    <span className="badge bg-success rounded-pill me-3">3</span>
                    <span><strong>Connect</strong> your exchange &amp; activate with <span className="fw-semibold text-success">$120 USDT</span> to unlock trading</span>
                  </li>
                </ul>
                <div className="text-center text-lg-start mt-auto">
                  <a
                    href="/auth/registration"
                    className="btn btn-primary btn-lg px-4 fw-bold rounded-3 mb-3"
                  >
                    Get Started
                  </a>
                  <div className="small text-muted mb-2">
                    Already a member? <a href="/auth/login" className="text-decoration-underline">Sign in</a>
                  </div>
                  <div className="alert alert-info d-inline-flex align-items-center py-2 px-3 mb-0" role="alert" style={{fontSize: '1rem'}}>
                    <i className="bi bi-shield-exclamation me-2"></i>
                    <span>
                      <strong>Tip:</strong> Enable 2FA for account safety. Never share your credentials.
                    </span>
                  </div>
                </div>
              </div>
              {/* Key Benefits */}
              <div className="col-lg-6 mt-4 mt-lg-0 d-flex align-items-stretch">
                <div className="card  border-0 p-4 h-100 w-100 d-flex flex-column justify-content-between" style={{backgroundColor: '#f3f5fe'}}>
                  <h5 className="fw-bold mb-3 text-center">Why AlgoBot?</h5>
                  <ul className="list-unstyled mb-4 px-2">
                    <li className="mb-3 d-flex align-items-start">
                      <span className="me-3 text-primary fs-4"><i className="bi bi-cpu"></i></span>
                      <span>
                        <span className="fw-semibold">AI Automated Trades:</span>
                        <br className="d-md-none"/>
                        Work smarter, not harder with real algorithm-driven trading.
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <span className="me-3 text-primary fs-4"><i className="bi bi-graph-up"></i></span>
                      <span>
                        <span className="fw-semibold">Transparency &amp; Control:</span>
                        <br className="d-md-none"/>
                        Manage your assets from your own exchange, anytime.
                      </span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <span className="me-3 text-success fs-4"><i className="bi bi-currency-dollar"></i></span>
                      <span>
                        <span className="fw-semibold">Simple, Profitable Plans:</span>
                        <br className="d-md-none"/>
                        Activate and choose a strategy, then let AlgoBot work for you.
                      </span>
                    </li>
                    <li className="d-flex align-items-start">
                      <span className="me-3 text-warning fs-4"><i className="bi bi-people"></i></span>
                      <span>
                        <span className="fw-semibold">Global Community:</span>
                        <br className="d-md-none"/>
                        Learn, share, and grow with support from thousands of traders.
                      </span>
                    </li>
                  </ul>
                  <div className="text-center">
                    <button
                      onClick={() => scrollToSection('testimonials')}
                      className="btn btn-outline-primary btn-sm px-3 fw-semibold rounded-pill"
                    >
                      See Real Success Stories
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Affiliate Program */}
        <section className="py-5 bg- border-top border-bottom">
          <div className="">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-12">
                <div className="text-center mb-5 pt-5">
                  <span className="badge bg-success mb-2 px-3 py-3 fs-6">
                    <i className="bi bi-gift me-1"></i> Earn with AlgoBot
                  </span>
                  <h2 className="display-5 fw-bold mb-3">Become an Affiliate &amp; Boost Your Crypto <span className="primary">Earnings</span></h2>
                  <p className="lead text-muted mb-0">
                    Share your personal <span className="text-primary fw-semibold">referral link</span> and start earning up to <span className="fw-bold text-success">70% commission</span> from every successful activation. Level up your rewards as your network grows—top earners can receive <span className="fw-bold">up to 35,000 USDT/month</span>.<br />
                    <span className="d-block mt-2 text-dark small">
                      <i className="bi bi-stars text-warning me-1"></i>
                      For content creators, traders, and enterprising community leaders.
                    </span>
                  </p>
                </div>

                <div className="row g-4 align-items-stretch mb-4">
                  <div className="col-md-7">
                    <div className="card h-100 shadow-card glass-card p-4">
                      <h4 className="fw-bold mb-2 text-primary">How It Works</h4>
                      <ul className="list-unstyled mb-3">
                        <li className="mb-3 d-flex align-items-start">
                          <span className="me-3 text-success fs-4">
                            <i className="bi bi-link-45deg"></i>
                          </span>
                          <span>
                            <span className="fw-semibold">Get Your Referral Link:</span> Instantly receive your unique invite link after registering.
                          </span>
                        </li>
                        <li className="mb-3 d-flex align-items-start">
                          <span className="me-3 text-warning fs-4">
                            <i className="bi bi-bullhorn-fill"></i>
                          </span>
                          <span>
                            <span className="fw-semibold">Share &amp; Promote:</span> Invite friends, followers, or your network to join AlgoBot.
                          </span>
                        </li>
                        <li className="mb-3 d-flex align-items-start">
                          <span className="me-3 text-primary fs-4">
                            <i className="bi bi-coin"></i>
                          </span>
                          <span>
                            <span className="fw-semibold">Earn Commissions:</span> Receive up to <span className="fw-bold text-success">70%</span> on every qualified activation and grow your team for higher rewards.
                          </span>
                        </li>
                      </ul>
                      <div className="alert alert-primary d-flex align-items-center py-2 mb-0" style={{backgroundColor: 'var(--primary, #FF6B35)', color: '#fff'}}>
                        <i className="bi bi-clipboard-check me-2"></i>
                        <span>Affiliate dashboard makes it easy to track your earnings, referrals, and goals.</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-5 d-flex">
                    <div className="card h-100 w-100 text-center bg-primary bg-opacity-10 border-0 shadow-card d-flex flex-column align-items-center justify-content-center">
                      <div className="mb-3">
                        <i className="bi bi-trophy-fill fs-1 text-warning"></i>
                      </div>
                      <h5 className="fw-bold mb-2">Up to 70% Commissions</h5>
                      <p className="mb-2 small">
                        Advance affiliate levels and unlock even higher earnings as your team grows.
                      </p>
                      <a
                        href="/auth/register"
                        className="btn btn-primary btn-sm px-4 fw-semibold rounded-pill mt-1"
                      >
                        Start Earning Now
                      </a>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered mb-0 text-center align-middle bg-white">
                    <thead className="table-light">
                      <tr>
                        <th>Level</th>
                        <th>Requirement</th>
                        <th>Direct Award</th>
                        <th>Team Reward</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-bold">V1</td>
                        <td>Register &amp; purchase a membership</td>
                        <td>$30</td>
                        <td>20%</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">V2</td>
                        <td>3 direct V1s + 20 members</td>
                        <td>$40</td>
                        <td>30%</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">V3</td>
                        <td>5 directs, 3 V2s + 100 members</td>
                        <td>$50</td>
                        <td>40%</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">V4</td>
                        <td>8 directs, 3 V3s + 300 members</td>
                        <td>$60</td>
                        <td>50%</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">V5</td>
                        <td>12 directs, 3 V4s + 800 members</td>
                        <td>$65</td>
                        <td>55%</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">V6</td>
                        <td>20 directs, 3 V5s + 1500 members</td>
                        <td>$70</td>
                        <td>60%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-center mt-4">
                  <a
                    href="/auth/registration"
                    className="btn btn-primary btn-lg px-5 fw-semibold rounded-pill shadow-sm"
                  >
                    Join Now &amp; Start Earning
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section id="testimonials" className="py-5  bg-white border-top border-bottom">
          <div>
            <h2 className="display-5 fw-bold text-center mb-2 text-dark">Real User <span className="primary">Reviews</span></h2>
            <p className="text-center text-muted mb-5 small">
              Discover how traders around the world trust <b>AlgoBot</b> for dependable, profitable, and stress-free automated trading!
            </p>
            <div className=" container">
              <div className="row g-4 justify-content-center">
                {/* Review 1 */}
                <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch" >
                  <div className="card glass-card shadow-card border-0 p-4 w-100 h-100" style={{backgroundColor: '#f3f5fe'}}>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <span className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 60, height: 60 }}>
                        <i className="bi bi-person-fill fs-2 text-primary"></i>
                      </span>
                      <img
                        src="https://randomuser.me/api/portraits/women/72.jpg"
                        alt="Sarah K."
                        className="rounded-circle border border-3 border-primary"
                        style={{ width: 48, height: 48, objectFit: "cover", marginLeft: -24, boxShadow: '0 0 0 2px #fff' }}
                      />
                    </div>
                    <blockquote className="fst-italic text-dark mb-3 flex-grow-1">
                      “AlgoBot changed my trading experience. I earn more and feel safe with every trade. Support actually listens!”
                    </blockquote>
                    <div>
                      <span className="fw-bold text-primary">Sarah K.</span>
                      <span className="text-muted small ms-1">| Singapore • Pro Trader</span>
                      <div className="mt-1">
                        <span className="badge bg-primary bg-opacity-10 text-primary me-2">
                          <i className="bi bi-star-fill me-1"></i>5.0
                        </span>
                        <i className="bi bi-patch-check-fill text-primary" title="Verified Reviewer" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review 2 */}
                <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
                  <div className="card glass-card shadow-card border-0 p-4 w-100 h-100" style={{backgroundColor: '#f3f5fe'}}>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <span className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 60, height: 60 }}>
                        <i className="bi bi-person-fill fs-2 text-success"></i>
                      </span>
                      <img
                        src="https://randomuser.me/api/portraits/men/74.jpg"
                        alt="Jose M."
                        className="rounded-circle border border-3 border-success"
                        style={{ width: 48, height: 48, objectFit: "cover", marginLeft: -24, boxShadow: '0 0 0 2px #fff' }}
                      />
                    </div>
                    <blockquote className="fst-italic text-dark mb-3 flex-grow-1">
                      “Simple, transparent and very profitable! Real strategies, quick withdrawals, and peace of mind every day.”
                    </blockquote>
                    <div>
                      <span className="fw-bold text-success">Jose M.</span>
                      <span className="text-muted small ms-1">| Mexico City • Investor</span>
                      <div className="mt-1">
                        <span className="badge bg-success bg-opacity-10 text-success me-2">
                          <i className="bi bi-star-fill me-1"></i>5.0
                        </span>
                        <i className="bi bi-patch-check-fill text-success" title="Verified Reviewer" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review 3 */}
                <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
                  <div className="card glass-card shadow-card border-0 p-4 w-100 h-100" style={{backgroundColor: '#f3f5fe'}}>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <span className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 60, height: 60 }}>
                        <i className="bi bi-person-fill fs-2 text-warning"></i>
                      </span>
                      <img
                        src="https://randomuser.me/api/portraits/women/57.jpg"
                        alt="Fatima A."
                        className="rounded-circle border border-3 border-warning"
                        style={{ width: 48, height: 48, objectFit: "cover", marginLeft: -24, boxShadow: '0 0 0 2px #fff' }}
                      />
                    </div>
                    <blockquote className="fst-italic text-dark mb-3 flex-grow-1">
                      “I've tried many bots, but AlgoBot is in a league of its own—consistent performance and amazing support.”
                    </blockquote>
                    <div>
                      <span className="fw-bold text-warning">Fatima A.</span>
                      <span className="text-muted small ms-1">| Dubai • Daily Trader</span>
                      <div className="mt-1">
                        <span className="badge bg-warning bg-opacity-10 text-warning me-2">
                          <i className="bi bi-star-fill me-1"></i>5.0
                        </span>
                        <i className="bi bi-patch-check-fill text-warning" title="Verified Reviewer" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review 4 */}
                <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
                  <div className="card glass-card shadow-card border-0 p-4 w-100 h-100" style={{backgroundColor: '#f3f5fe'}}>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <span className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 60, height: 60, backgroundColor: 'var(--primary, #7952b3)' }}>
                        <i className="bi bi-person-fill fs-2 primary"></i>
                      </span>
                      <img
                        src="https://randomuser.me/api/portraits/men/65.jpg"
                        alt="Li Wei"
                        className="rounded-circle border border-3 primary"
                        style={{ width: 48, height: 48, objectFit: "cover", marginLeft: -24, boxShadow: '0 0 0 2px #fff' }}
                      />
                    </div>
                    <blockquote className="fst-italic text-dark mb-3 flex-grow-1">
                      “AlgoBot is the only tool I trust for automated trades. Reliable results and fast withdrawals every time.”
                    </blockquote>
                    <div>
                      <span className="fw-bold primary">Li Wei</span>
                      <span className="text-muted small ms-1">| Shanghai • Crypto Enthusiast</span>
                      <div className="mt-1">
                        <span className="badge bg-primary bg-opacity-10 primary me-2">
                          <i className="bi bi-star-fill me-1"></i>5.0
                        </span>
                        <i className="bi bi-patch-check-fill primary" title="Verified Reviewer" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review 5 */}
                <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
                  <div className="card glass-card shadow-card border-0 p-4 w-100 h-100" style={{backgroundColor: '#f3f5fe'}}>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <span className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 60, height: 60 }}>
                        <i className="bi bi-person-fill fs-2 text-danger"></i>
                      </span>
                      <img
                        src="https://randomuser.me/api/portraits/women/36.jpg"
                        alt="Amy L."
                        className="rounded-circle border border-3 border-danger"
                        style={{ width: 48, height: 48, objectFit: "cover", marginLeft: -24, boxShadow: '0 0 0 2px #fff' }}
                      />
                    </div>
                    <blockquote className="fst-italic text-dark mb-3 flex-grow-1">
                      “Fast onboarding and even faster support! The transparent profit tracking gives me so much confidence.”
                    </blockquote>
                    <div>
                      <span className="fw-bold text-danger">Amy L.</span>
                      <span className="text-muted small ms-1">| London • AlgoBot Fan</span>
                      <div className="mt-1">
                        <span className="badge bg-danger bg-opacity-10 text-danger me-2">
                          <i className="bi bi-star-fill me-1"></i>4.9
                        </span>
                        <i className="bi bi-patch-check-fill text-danger" title="Verified Reviewer" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review 6 */}
                <div className="col-12 col-md-6 col-lg-4 d-flex align-items-stretch">
                  <div className="card glass-card shadow-card border-0 p-4 w-100 h-100" style={{backgroundColor: '#f3f5fe'}}>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                      <span className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 60, height: 60 }}>
                        <i className="bi bi-person-fill fs-2 text-success"></i>
                      </span>
                      <img
                        src="https://randomuser.me/api/portraits/men/11.jpg"
                        alt="Ravi S."
                        className="rounded-circle border border-3 border-success"
                        style={{ width: 48, height: 48, objectFit: "cover", marginLeft: -24, boxShadow: '0 0 0 2px #fff' }}
                      />
                    </div>
                    <blockquote className="fst-italic text-dark mb-3 flex-grow-1">
                      “I diversified with AlgoBot and now have more stable, incremental gains week after week. No regrets.”
                    </blockquote>
                    <div>
                      <span className="fw-bold text-success">Ravi S.</span>
                      <span className="text-muted small ms-1">| Bangalore • Engineer</span>
                      <div className="mt-1">
                        <span className="badge bg-success bg-opacity-10 text-success me-2">
                          <i className="bi bi-star-fill me-1"></i>5.0
                        </span>
                        <i className="bi bi-patch-check-fill text-success" title="Verified Reviewer" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-5">
              <a
                href="/auth/registration"
                className="btn btn-primary btn-lg px-5 fw-semibold rounded-pill shadow-card"
              >
                Become a Satisfied Trader&nbsp;
                <i className="bi bi-arrow-right-short fs-4 align-middle"/>
              </a>
            </div>
          </div>
        </section>

        {/* AlgoBot – Essential Power at a Glance */}
        <section className="py-5 border-top border-bottom">
          <div className="">
            <div className="row g-4 align-items-center">
              {/* Visual Panel */}
              <div className="col-lg-5 d-flex flex-column align-items-center">
                <div className="border border-primary rounded-4 p-4 bg-white shadow-card mb-3 w-100 text-center">
                  <div className="mb-3">
                    <span className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-flex justify-content-center align-items-center">
                      <i className="bi bi-robot fs-1 text-primary"></i>
                    </span>
                  </div>
                  <div className="fs-4 fw-bold text-primary mb-2">Easy, Secure, Profitable</div>
                  <div>
                    <span className="badge rounded-pill bg-success bg-opacity-10 text-success px-3 mb-2">
                      80:20 Profit Split
                    </span>
                  </div>
                  <div className="fs-6 text-secondary">
                    <i className="bi bi-shield-lock me-1 text-success"></i>
                    API keys stay on your exchange<br/>
                    <i className="bi bi-clock-history me-1 text-primary"></i>
                    24/7 Auto-Trading
                  </div>
                </div>
                <a
                  href="/auth/registration"
                  className="btn btn-primary btn-lg rounded-pill fw-semibold px-4 shadow-card mt-3"
                >
                  Try AlgoBot Now <i className="bi bi-arrow-right-short fs-4 ms-1" />
                </a>
              </div>
              {/* Info Panel */}
              <div className="col-lg-7">
                <h2 className="fw-bold display-6 mb-3  text-dark     text-lg-start text-center">
                    Why Choose <span className="primary">AlgoBot?</span>
              
                </h2>
                <ul className="list-group list-group-flush fs-5 mb-4">
                  <li className="list-group-item bg-transparent border-0 px-0 py-3 d-flex align-items-center">
                    <i className="bi bi-lightning-charge fs-2 text-primary me-3"></i>
                    <span><b>Instant Activation:</b> Get started in minutes—no coding or trading experience needed.</span>
                  </li>
                  <li className="list-group-item bg-transparent border-0 px-0 py-3 d-flex align-items-center">
                    <i className="bi bi-bar-chart-line-up fs-2 text-success me-3"></i>
                    <span><b>Smart Automation:</b> AI-powered trades, fully hands-free, real-time market scanning.</span>
                  </li>
                  <li className="list-group-item bg-transparent border-0 px-0 py-3 d-flex align-items-center">
                    <i className="bi bi-shield-check fs-2 text-primary me-3"></i>
                    <span><b>Zero Risk to Funds:</b> Money always stays on your exchange wallet. Total control.</span>
                  </li>
                  <li className="list-group-item bg-transparent border-0 px-0 py-3 d-flex align-items-center">
                    <i className="bi bi-globe-2 fs-2 text-warning me-3"></i>
                    <span><b>Trusted Global Support:</b> Works with Binance, Huobi, Coinbase and more.</span>
                  </li>
                </ul>
                <div
                  className="alert alert-primary d-flex align-items-center px-3 py-2 mt-3"
                  role="alert"
                >
                  <i className="bi bi-info-circle me-2"></i>
                  <span>
                    <strong>Tip:</strong>&nbsp;Enable 2FA security in your account settings for full protection.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-5 bg-white border-top border-bottom">
          <div className="container">
            <h2 className="display-5 fw-bold text-center mb-4 text-dark">Frequently Asked <span className="primary">Questions</span></h2>
            <p className="text-center text-muted mb-5 fs-5">
              Find quick answers to the most common AlgoBot questions below.
            </p>
            <div className="row justify-content-center">
              <div className="col-lg-10">
                <div className="accordion" id="faqAccordion">
                  {/* 1 */}
                  <div className="accordion-item shadow-sm mb-3 rounded ">
                    <h2 className="accordion-header" id="heading1">
                      <button className="accordion-button fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                        <i className="bi bi-currency-dollar me-2 text-success" ></i>
                        Minimum trading capital to start with AlgoBot?
                      </button>
                    </h2>
                    <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        <ul className="mb-0 ps-3">
                          <li>Start with as little as <b>$10</b>.</li>
                          <li>AlgoBot follows Binance Exchange minimums.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* 2 */}
                  <div className="accordion-item shadow-sm mb-3 rounded">
                    <h2 className="accordion-header" id="heading2">
                      <button className="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                        <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
                        What are the risks if AlgoBot stops operating?
                      </button>
                    </h2>
                    <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        <ul className="mb-0 ps-3">
                          <li>You only risk the bot rental fee.</li>
                          <li>Your exchange balance remains unchanged in your account (Binance, Coinbase Pro, Huobi, etc.).</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* 3 */}
                  <div className="accordion-item shadow-sm mb-3 rounded">
                    <h2 className="accordion-header" id="heading3">
                      <button className="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                        <i className="bi bi-bar-chart-fill me-2 text-primary"></i>
                        What is AlgoBot's profit sharing?
                      </button>
                    </h2>
                    <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        <ul className="mb-0 ps-3">
                          <li>You keep <b>80%</b> of the profit.</li>
                          <li>AlgoBot receives <b>20%</b>.</li>
                          <li>Applies to all trade amounts.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* 4 */}
                  <div className="accordion-item shadow-sm mb-3 rounded">
                    <h2 className="accordion-header" id="heading4">
                      <button className="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                        <i className="bi bi-graph-up-arrow me-2 text-success"></i>
                        What is the profit potential with AlgoBot?
                      </button>
                    </h2>
                    <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        <ul className="mb-0 ps-3">
                          <li>Set your own profit targets and strategies.</li>
                          <li>Full control over all trading parameters for optimal returns.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* 5 */}
                  <div className="accordion-item shadow-sm mb-3 rounded">
                    <h2 className="accordion-header" id="heading5">
                      <button className="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#faq5">
                        <i className="bi bi-people-fill me-2 text-primary"></i>
                        Does AlgoBot support Copy Trading?
                      </button>
                    </h2>
                    <div id="faq5" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        <ul className="mb-0 ps-3">
                          <li>Yes, follow top professional traders automatically.</li>
                          <li>No need for your own market analysis or experience.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* 6 */}
                  <div className="accordion-item shadow-sm mb-3 rounded">
                    <h2 className="accordion-header" id="heading6">
                      <button className="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#faq6">
                        <i className="bi bi-wallet2 me-2 text-warning"></i>
                        Can I withdraw capital or profits anytime?
                      </button>
                    </h2>
                    <div id="faq6" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        <ul className="mb-0 ps-3">
                          <li>Yes, withdraw your funds from your exchange wallet at any time.</li>
                          <li>AlgoBot never withdraws your funds directly.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* 7 */}
                  <div className="accordion-item shadow-sm mb-3 rounded">
                    <h2 className="accordion-header" id="heading7">
                      <button className="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#faq7">
                        <i className="bi bi-lock-fill me-2 text-secondary"></i>
                        Can AlgoBot access or take my funds?
                      </button>
                    </h2>
                    <div id="faq7" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        <ul className="mb-0 ps-3">
                          <li>No, AlgoBot cannot retrieve or withdraw your funds.</li>
                          <li>API allows trading only, not withdrawal rights.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* 8 */}
                  <div className="accordion-item shadow-sm mb-3 rounded">
                    <h2 className="accordion-header" id="heading8">
                      <button className="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#faq8">
                        <i className="bi bi-shield-check me-2 text-success"></i>
                        Can my trading capital be depleted to zero?
                      </button>
                    </h2>
                    <div id="faq8" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        <ul className="mb-0 ps-3">
                          <li>No margin calls, only spot trading—so no risk of total liquidation.</li>
                          <li>AlgoBot trades only high-liquidity coins for safety.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* 9 */}
                  <div className="accordion-item shadow-sm mb-3 rounded">
                    <h2 className="accordion-header" id="heading9">
                      <button className="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#faq9">
                        <i className="bi bi-wifi-off me-2 text-dark"></i>
                        What happens if my device goes offline?
                      </button>
                    </h2>
                    <div id="faq9" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        <ul className="mb-0 ps-3">
                          <li>Your bot keeps trading automatically, even if your device is offline.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  {/* 10 */}
                  <div className="accordion-item shadow-sm mb-3 rounded">
                    <h2 className="accordion-header" id="heading10">
                      <button className="accordion-button collapsed fw-semibold" type="button" data-bs-toggle="collapse" data-bs-target="#faq10">
                        <i className="bi bi-award-fill me-2 text-primary"></i>
                        Will AlgoBot provide training and support?
                      </button>
                    </h2>
                    <div id="faq10" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        <ul className="mb-0 ps-3">
                          <li>Yes! All members receive <b>free training & mentoring</b> via Zoom, events & personal guidance.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="py-5 bg- bg-opacity-10 text-dark">
          <div className="">
            <div className="row justify-content-center align-items-center">
              <div className="col-lg-8 text-center">
                <h2 className="display-5 fw-bold mb-3">
                  Ready to Start with the World's Top Crypto  <span className="primary">Bot</span>?
                </h2>
                <p className="lead text-muted mb-4">
                  Experience proven profitability with <strong>AlgoBot</strong>—the AI-driven quantitative trading platform trusted by thousands. Start automated trading on your mobile in one tap. 
                  <br className="d-none d-md-block" />
                  No coding. No prior trading experience needed.
                </p>
                <a
                  href="/auth/registration"
                  className="btn btn-primary btn-lg px-5 fw-semibold rounded-pill shadow-card"
                >
                  Get Started Now&nbsp;
                  <i className="bi bi-arrow-right-short fs-4 align-middle"/>
                </a>
                <div className="mt-3">
                  <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                    Free demo &amp; support for new traders
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
    <Footer />
    </>
  );
}

