'use client';

import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import BootstrapIcon from '../home/components/BootstrapIcon';

export default function BlogPage() {
  const blogPosts = [
    {
      title: 'Understanding Quantitative Trading Strategies',
      excerpt: 'Learn how algorithmic trading strategies work and how they can improve your trading performance.',
      date: 'Dec 15, 2024',
      category: 'Trading',
      author: 'AlgoBot Team'
    },
    {
      title: 'Risk Management in Crypto Trading',
      excerpt: 'Essential risk management techniques every crypto trader should know and implement.',
      date: 'Dec 10, 2024',
      category: 'Education',
      author: 'AlgoBot Team'
    },
    {
      title: 'Best Practices for Exchange API Security',
      excerpt: 'How to securely connect and manage your exchange APIs while using trading bots.',
      date: 'Dec 5, 2024',
      category: 'Security',
      author: 'AlgoBot Team'
    },
    {
      title: 'Market Analysis: Trends and Insights',
      excerpt: 'Current market trends and how automated trading can help you capitalize on opportunities.',
      date: 'Nov 28, 2024',
      category: 'Analysis',
      author: 'AlgoBot Team'
    },
    {
      title: 'Getting Started with Copy Trading',
      excerpt: 'A beginner\'s guide to copy trading and how to follow successful traders.',
      date: 'Nov 20, 2024',
      category: 'Trading',
      author: 'AlgoBot Team'
    },
    {
      title: 'Optimizing Your Trading Bot Performance',
      excerpt: 'Tips and tricks to maximize your trading bot\'s efficiency and profitability.',
      date: 'Nov 15, 2024',
      category: 'Tips',
      author: 'AlgoBot Team'
    }
  ];

  return (
    <>
      <Header />
      <div className="min-vh-100" style={{ backgroundColor: '#f3f5fe' }}>
        <main className="container px-3 px-md-4 px-lg-5 py-5" style={{ maxWidth: '1500px', margin: '0 auto' }}>
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              AlgoBot <span className="primary">Blog</span>
            </h1>
            <p className="lead text-muted">
              Stay updated with the latest insights, tips, and news from the world of automated crypto trading.
            </p>
          </div>

          <div className="row g-4">
            {blogPosts.map((post, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-card h-100 algo-card-hover">
                  <div className="card-body p-4 d-flex flex-column">
                    <span className="badge bg-primary mb-3 align-self-start">{post.category}</span>
                    <h5 className="fw-bold mb-3">{post.title}</h5>
                    <p className="text-muted mb-3 flex-grow-1">{post.excerpt}</p>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <small className="text-muted">{post.date}</small>
                      <small className="text-muted">{post.author}</small>
                    </div>
                    <a href="#" className="btn btn-outline-primary btn-sm">
                      Read More <BootstrapIcon name="arrow-right" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <a href="#" className="btn btn-primary btn-lg">
              Load More Articles
            </a>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
