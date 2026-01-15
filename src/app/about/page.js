'use client';

import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';
import Image from 'next/image'; 

export default function AboutPage() {
  const values = [
    {
      icon: 'shield-check',
      title: 'Security First',
      description: 'Your funds and data security is our top priority. We use industry-leading security practices.'
    },
    {
      icon: 'lightbulb',
      title: 'Innovation',
      description: 'Continuously improving our AI algorithms and trading strategies to stay ahead of the market.'
    },
    {
      icon: 'people',
      title: 'Community Driven',
      description: 'Built by traders, for traders. Our community shapes our product roadmap and features.'
    },
    {
      icon: 'graph-up-arrow',
      title: 'Transparency',
      description: 'Clear, honest communication about our strategies, fees, and performance metrics.'
    }
  ];

  const stats = [
    { value: '1M+', label: 'Active Users' },
    { value: '150+', label: 'Countries' },
    { value: '7+', label: 'Years Experience' },
    { value: '99.9%', label: 'Uptime' }
  ];

  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              About <span className="primary">AlgoBot</span>
            </h1>
            <p className="lead text-muted">
              Empowering traders worldwide with AI-powered quantitative trading since 2017.
            </p>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-card p-4 h-100">
                <h3 className="fw-bold mb-4">Our Mission</h3>
                <p className="text-muted mb-3">
                  At AlgoBot, we believe that everyone should have access to professional-grade trading tools. 
                  Our mission is to democratize quantitative trading by making advanced AI algorithms accessible 
                  to traders of all experience levels.
                </p>
                <p className="text-muted mb-0">
                  We combine cutting-edge artificial intelligence with proven quantitative trading strategies 
                  to help our users achieve their financial goals while managing risk effectively.
                </p>
              </div>
            </div>
            <div className="col-12 col-lg-6">
              <div className="card border-0 shadow-card p-4 h-100">
                <h3 className="fw-bold mb-4">Our Story</h3>
                <p className="text-muted mb-3">
                  Founded in 2017, AlgoBot started as a passion project by a group of traders and developers 
                  who were frustrated with the complexity of existing trading tools.
                </p>
                <p className="text-muted mb-0">
                  Today, we serve millions of users across 150+ countries, helping them automate their trading 
                  strategies and build wealth through intelligent, data-driven decision making.
                </p>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-5">
            {stats.map((stat, index) => (
              <div key={index} className="col-6 col-md-3">
                <div className="card border-0 shadow-card text-center p-4">
                  <div className="display-4 fw-bold primary mb-2">{stat.value}</div>
                  <div className="text-muted">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5">
            <h2 className="fw-bold text-center mb-4">Our Values</h2>
            <div className="row g-4">
              {values.map((value, index) => (
                <div key={index} className="col-12 col-md-6 col-lg-3">
                  <div className="card border-0 shadow-card p-4 h-100 text-center">
                    <div className="d-flex justify-content-center mb-3">
                      <div 
                        className="bg-primary bg-opacity-10 d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                          width: "72px",
                          height: "72px",
                        }}
                      >
                        <BootstrapIcon name={value.icon} className="fs-1 text-primary" />
                      </div>
                    </div>
                    <h5 className="fw-bold mb-3">{value.title}</h5>
                    <p className="text-muted small">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card border-0 shadow-card p-4 text-center">
            <h3 className="fw-bold mb-3">Join Our Team</h3>
            <p className="text-muted mb-4">
              We're always looking for talented individuals to join our mission. Check out our open positions.
            </p>
            <a href="/contact" className="btn btn-primary ">
              Get in Touch
            </a>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
